// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show browser notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png', // You can add your app icon here
      badge: '/badge.png',
      ...options,
    })
  }
}

// Show notification for new message
export const notifyNewMessage = (senderName: string, messagePreview: string, itemTitle: string) => {
  showNotification(`New message from ${senderName}`, {
    body: messagePreview.substring(0, 100),
    tag: 'new-message',
    requireInteraction: false,
    data: { itemTitle },
  })
}
