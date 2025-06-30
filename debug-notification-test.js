// Test notification creation directly
const testCreateNotification = async () => {
  const galleryId = 'L9IAQJFNZ6rgbmyTKEvZ';
  const userName = '.';
  const deviceId = '87d0149b-3478-46d3-b2c3-51970e6759e6';
  
  console.log('🧪 Creating test notification for self-tagging...');
  
  const notificationData = {
    type: 'tag',
    title: 'Du hast dich markiert!',
    message: 'Du hast dich selbst in einem Foto markiert',
    targetUser: userName,
    targetDeviceId: deviceId,
    fromUser: userName,
    fromDeviceId: deviceId,
    mediaId: 'test-media-id',
    mediaType: 'image',
    mediaUrl: '',
    read: false,
    createdAt: new Date().toISOString()
  };
  
  console.log('📋 Test notification data:', notificationData);
  console.log('📂 Collection path:', `galleries/${galleryId}/notifications`);
  
  // This would be called from the browser console where Firebase is available
  return notificationData;
};

console.log('Test function ready. Call testCreateNotification() from browser console.');