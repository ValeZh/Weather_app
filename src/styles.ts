// src/styles.ts
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedText: {
    fontSize: 18,
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 10,
  },
  resetButtonText: {
    color: 'white',
  },
});

export default styles;