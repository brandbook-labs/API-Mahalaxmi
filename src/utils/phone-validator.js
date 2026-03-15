// utils/phoneValidator.js

const isValidIndianMobile = (phone) => {
    // ୧. ପ୍ରଥମ ନିୟମ: କେବଳ ୬, ୭, ୮ କିମ୍ବା ୯ ରୁ ଆରମ୍ଭ ହେବ ଏବଂ ଠିକ୍ ୧୦ ଡିଜିଟ୍ ଥିବ।
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!phone || !mobileRegex.test(phone)) {
        return false;
    }

    // ୨. ଦ୍ୱିତୀୟ ନିୟମ: ସବୁଗୁଡିକ ସମାନ ଅଙ୍କ ଥିଲେ ଅଟକାଇବ (ଉଦାହରଣ: 9999999999, 8888888888, 7777777777)
    // ଏହାଦ୍ୱାରା ଆପଣଙ୍କୁ ବ୍ଲକଲିଷ୍ଟରେ ଏଗୁଡିକୁ ଲେଖିବା ଦରକାର ନାହିଁ।
    const isAllSameDigits = /^(\d)\1{9}$/.test(phone);
    if (isAllSameDigits) {
        return false;
    }

    // ୩. ତୃତୀୟ ନିୟମ: ସାଧାରଣ ଫାଲତୁ (Dummy) ନମ୍ବର ବ୍ଲକଲିଷ୍ଟ
    const blockedNumbers = [
        "9876543210", "8765432109", "7654321098", "6543210987", // ସିରିଏଲ୍ ଡିସେଣ୍ଡିଂ ନମ୍ବର
        "9000000000", "8000000000", "7000000000", "6000000000", // ଶେଷରେ ବହୁତ ଗୁଡିଏ ଶୂନ
        "9898989898", "8989898989", "9879879870", "9998887776", // ବାରମ୍ବାର ଆସୁଥିବା ପ୍ୟାଟର୍ଣ୍ଣ
        "9123456789" // ୯ ପରେ ସିରିଏଲ୍ ନମ୍ବର
    ];

    if (blockedNumbers.includes(phone)) {
        return false;
    }

    return true; // ସବୁ ଚେକ୍ ପାସ୍ କଲେ True ହେବ ଏବଂ ସିଷ୍ଟମ୍ ଆଗକୁ ଯିବ
};

module.exports = {
    isValidIndianMobile
};