import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);

// {
//   publicKey: 'BFX_UbtvBEOTHDVrCxJjoY_9KyFflQww7YFTZjQ7fXuBvXV2_Hj9axQ_IlDBnRYIezeQz0kFBDx3f5li2eGiPz0',
//   privateKey: 'BliOzAuH1UC-5_lkVHlnPB_heZqD5AFKsd24xXQmne8'
// }
