// outsource dependencies
import React from 'react';
import HTMLViewLib from 'react-native-htmlview';

export interface HTMLViewProps {
    value: string;
    stylesheet?: any;
    renderNode?: ((props: RenderNodeProps) => React.ReactNode | undefined)
    | ((node: any, index: number, siblings: any[], parent: any, defaultRenderer: any) => React.ReactNode | undefined);
}

export interface RenderNodeProps {
    node: any;
    parent: any;
    index: number;
    siblings: any[];
    defaultRenderer: (node: any, parent: any) => React.ReactNode;
}

const normalizeHtmlValue = (raw: unknown): string => {
    if (typeof raw === 'string') { return raw; }
    if (Array.isArray(raw)) {
        return raw
            .map(item => {
                if (typeof item === 'string') { return item; }
                if (item && typeof item === 'object') {
                    const textValue = (item as any).text
                        || (item as any).description
                        || (item as any).value
                        || (item as any).html
                        || '';
                    return typeof textValue === 'string' ? textValue : '';
                }
                return '';
            })
            .filter(Boolean)
            .join('\n');
    }
    if (raw && typeof raw === 'object') {
        const textValue = (raw as any).text
            || (raw as any).description
            || (raw as any).value
            || (raw as any).html
            || '';
        return typeof textValue === 'string' ? textValue : '';
    }
    return '';
};

const decodeHtmlEntities = (html: string): string => html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, '\'');

export const HTMLView: React.FC<HTMLViewProps> = ({ value, stylesheet, renderNode }) => {
    const normalizedValue = decodeHtmlEntities(normalizeHtmlValue(value));
    if (!normalizedValue.trim()) { return null; }

    const adaptedRenderNode = renderNode
        // eslint-disable-next-line max-params
        ? (node: any, index: number, siblings: any[], parent: any, defaultRenderer: any) => {
            if (renderNode.length >= 2) {
                return (renderNode as any)(node, index, siblings, parent, defaultRenderer);
            }
            return (renderNode as any)({
                node,
                index,
                parent,
                siblings,
                defaultRenderer,
            });
        }
        : undefined;

    return (
        <HTMLViewLib
            value={normalizedValue}
            stylesheet={stylesheet}
            renderNode={adaptedRenderNode}
        />
    );
};

export default HTMLView;
