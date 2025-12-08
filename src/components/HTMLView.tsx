// outsource dependencies
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// local dependencies
import { OFFSET } from 'constants/offset';

const screenWidth = Dimensions.get('window').width;

export interface HTMLViewProps {
    value: string;
    stylesheet?: any;
    renderNode?: (props: RenderNodeProps) => React.ReactNode | undefined;
}

export interface RenderNodeProps {
    node: any;
    parent: any;
    index: number;
    siblings: any[];
    defaultRenderer: (node: any, parent: any) => React.ReactNode;
}

export const HTMLView: React.FC<HTMLViewProps> = ({ value, stylesheet, renderNode }) => {

    const parseHTML = (html: string): any[] => {
        // Remove script and style tags completely
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
        // Match: any tag (<...>) or plain text (anything until next <)
        const tokenRegex = /<\/?[^>]+>|[^<]+/g;
        const tokens = html.match(tokenRegex);
        if (!tokens) {
            return [];
        }
    
        // Helper: parse attributes from tag content
        const parseAttributes = (attrString: string): Record<string, string> => {
            const attrs: Record<string, string> = {};
            if (!attrString.trim()) { return attrs; }
    
            // attr="value" | attr='value' | attr=value
            const attrRegex
                = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
    
            let match: RegExpExecArray | null;
            while ((match = attrRegex.exec(attrString)) !== null) {
                const [, name, v1, v2, v3] = match;
                const value = v1 ?? v2 ?? v3 ?? '';
                attrs[name] = value;
            }
            return attrs;
        };
    
        // Root node and stack for building tree
        const root = { name: 'root', children: [] as any[] };
        const stack: any[] = [root];
    
        for (const token of tokens) {
            const trimmed = token.trim();
            if (!trimmed) {
                continue;
            }
    
            // Comment — skip
            if (trimmed.startsWith('<!--')) {
                continue;
            }
    
            // Closing tag: </tag>
            if (trimmed.startsWith('</')) {
                const tagName = trimmed.slice(2, -1).trim().toLowerCase();
    
                // Pop until we find matching tag
                while (stack.length > 1) {
                    const node = stack.pop();
                    if (node.name === tagName) {
                        const parent = stack[stack.length - 1];
                        parent.children.push(node);
                        break;
                    }
                }
                continue;
            }
    
            // Opening or self-closing tag: <tag ...> or <tag ... />
            if (trimmed.startsWith('<')) {
                const isSelfClosing
                    = trimmed.endsWith('/>')
                    || /^<br\s*\/?>$/i.test(trimmed)
                    || /^<hr\s*\/?>$/i.test(trimmed)
                    || /^<img\s/i.test(trimmed);
    
                // Remove < and >, trim, remove trailing / for self-closing
                let inner = trimmed.slice(1, -1).trim();
                inner = inner.replace(/\/$/, '').trim();
    
                const [rawName, ...rest] = inner.split(/\s+/);
                const tagName = rawName.toLowerCase();
                const attrString = rest.join(' ');
                const attrs = parseAttributes(attrString);
    
                const node: any = {
                    name: tagName,
                    attrs,
                    children: [] as any[],
                };
    
                // Known self-closing tags
                if (isSelfClosing || tagName === 'br' || tagName === 'hr' || tagName === 'img') {
                    const parent = stack[stack.length - 1];
                    parent.children.push(node);
                } else {
                    // Push to stack, will be closed later
                    stack.push(node);
                }
                continue;
            }
    
            // Text node
            const text = token.replace(/\s+/g, ' ').trim();
            if (!text) { continue; }
    
            const parent = stack[stack.length - 1];
            parent.children.push({
                name: 'text',
                data: text,
                children: [],
            });
        }
    
        // Flush unclosed tags (just in case HTML is not perfect)
        while (stack.length > 1) {
            const node = stack.pop();
            const parent = stack[stack.length - 1];
            parent.children.push(node);
        }
    
        // We don't need the artificial root
        return root.children;
    };
    // Default renderer for nodes
    const defaultRenderer = (nodes: any[], parent: any = null): React.ReactNode => {
        return nodes.map((node, index) => {
            // Custom render node if provided
            if (renderNode) {
                const customResult = renderNode({
                    node,
                    parent,
                    index,
                    siblings: nodes,
                    defaultRenderer: (childNodes, childParent) =>
                        defaultRenderer(childNodes || [], childParent),
                });
                
                if (customResult !== undefined) {
                    return customResult;
                }
            }

            // Skip newlines
            if (node.data === '\n') {
                return <View key={`newline-${index}`} />;
            }

            const key = `${node.name}-${index}`;

            // Render based on node type
            switch (node.name) {
                case 'text':
                    return (
                        <Text key={key} style={[styles.text, stylesheet?.p]}>
                            {node.data}
                        </Text>
                    );

                case 'p':
                    return (
                        <Text key={key} style={[styles.paragraph, stylesheet?.p]}>
                            {defaultRenderer(node.children, node)}
                        </Text>
                    );

                case 'strong':
                case 'b':
                    return (
                        <Text key={key} style={[styles.bold, stylesheet?.strong || stylesheet?.b]}>
                            {defaultRenderer(node.children, node)}
                        </Text>
                    );

                case 'em':
                case 'i':
                    return (
                        <Text key={key} style={[styles.italic, stylesheet?.em || stylesheet?.i]}>
                            {defaultRenderer(node.children, node)}
                        </Text>
                    );

                case 'u':
                case 'ins':
                    return (
                        <Text
                            key={key}
                            style={[styles.underline, stylesheet?.u || stylesheet?.ins]}
                        >
                            {defaultRenderer(node.children, node)}
                        </Text>
                    );

                case 'li':
                    return (
                        <View key={key} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={[styles.listItemText, stylesheet?.li]}>
                                {defaultRenderer(node.children, node)}
                            </Text>
                        </View>
                    );

                case 'ul':
                    return (
                        <View key={key} style={[styles.list, stylesheet?.ul]}>
                            {defaultRenderer(node.children, node)}
                        </View>
                    );

                case 'ol':
                    return (
                        <View key={key} style={[styles.list, stylesheet?.ol]}>
                            {defaultRenderer(node.children, node)}
                        </View>
                    );

                case 'br':
                    return <View key={key} style={styles.lineBreak} />;

                default:
                    return (
                        <Text key={key} style={stylesheet?.[node.name]}>
                            {defaultRenderer(node.children, node)}
                        </Text>
                    );
            }
        });
    };

    const nodes = parseHTML(value);

    return <View style={styles.container}>{defaultRenderer(nodes)}</View>;
};

export default HTMLView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    paragraph: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
        lineHeight: 24,
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    underline: {
        textDecorationLine: 'underline',
    },
    list: {
        marginLeft: 15,
        marginVertical: 5,
    },
    listItem: {
        flexDirection: 'row',
        marginVertical: 2,
        paddingRight: OFFSET.HORIZONTAL,
        width: screenWidth - OFFSET.HORIZONTAL * 3,
    },
    bullet: {
        marginRight: 8,
        marginTop: 2,
        fontSize: 16,
        lineHeight: 24,
    },
    listItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    lineBreak: {
        height: 10,
    },
});
