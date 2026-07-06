const fs = require('fs');
fetch('https://classiq-touch.vercel.app/api/slots')
  .then(res => res.json())
  .then(data => {
    const slots = data.slots;
    console.log(`Total slots fetched: ${slots.length}`);
    const grouped = slots.reduce((acc, slot) => {
      const key = new Date(slot.time).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    }, {});
    console.log(`Total grouped days: ${Object.keys(grouped).length}`);
    console.log(`First day: ${Object.keys(grouped)[0]}`);
    console.log(`Last day: ${Object.keys(grouped)[Object.keys(grouped).length - 1]}`);
  });
