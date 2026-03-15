// 🕒 Optimized Time Parser: Handles "13:00", "1:00 PM", "1:00PM", "01:00pm"
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    // Regex ବ୍ୟବହାର କରି ଘଣ୍ଟା, ମିନିଟ୍ ଏବଂ AM/PM କୁ ଅଲଗା କରିବା (ସ୍ପେସ୍ ଥାଉ କି ନଥାଉ)
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    
    if (!match) return 0; // ଯଦି ଫର୍ମାଟ୍ ଭୁଲ୍ ଥାଏ ତେବେ 0 ରିଟର୍ଣ୍ଣ କରିବ

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    // ଯଦି AM/PM ଅଛି (12-hour format)
    if (ampm) {
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
    } 
    // ଯଦି AM/PM ନାହିଁ (24-hour format), ତେବେ hour ସେମିତି ରହିବ (ଯେମିତିକି 13:00)

    // ସମୁଦାୟ ମିନିଟ୍ କାଲକୁଲେଟ୍ କରିବା
    return hour * 60 + minute; 
};

// ଉଦାହରଣ (କିପରି କାମ କରିବ):
// timeToMinutes("10:00")   => 600
// timeToMinutes("13:00")   => 780
// timeToMinutes("1:00PM")  => 780
// timeToMinutes("1:00 PM") => 780