self.addEventListener("push",event=>{
  const room=event.data?.json()?.room;
  if(!/^[0-9a-f-]{36}$/i.test(room))return;
  event.waitUntil(self.registration.showNotification("새 상담 신청이 도착했어요",{
    icon:"/consult/icon-192.png",body:"눌러서 상담 신청을 확인하세요.",tag:"consult-"+room,data:{room}
  }));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL("/consult/room",self.location.origin);
  target.searchParams.set("id",event.notification.data.room);
  event.waitUntil(clients.openWindow(target.href));
});
