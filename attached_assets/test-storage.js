// Test Firebase Storage Upload
// Open browser console and run this code

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config/firebase';

// Test upload function
async function testUpload() {
  try {
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testRef = ref(storage, 'test/test.txt');
    
    console.log('Testing upload...');
    await uploadBytes(testRef, testData);
    console.log('✅ Upload successful!');
    
    const url = await getDownloadURL(testRef);
    console.log('✅ Download URL:', url);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

// Run test
testUpload();
