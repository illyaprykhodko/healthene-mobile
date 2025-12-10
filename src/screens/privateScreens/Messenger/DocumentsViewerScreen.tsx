import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

interface DocumentsViewerScreenProps {
  // props here
}

const DocumentsViewerScreen = (props: DocumentsViewerScreenProps) => {
    const route = useRoute();
    console.log('route', route);
    return <View style={styles.container}>{/* Code here */}</View>;
};

export default DocumentsViewerScreen;

const styles = StyleSheet.create({
    container: {
    // style here
    },
});
