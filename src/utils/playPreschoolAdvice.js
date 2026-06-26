const advice = {
  uz: {
    plan: 'Uy va bog‘cha uchun amaliy reja',
    tips: [
      'Har kuni 15–20 daqiqalik navbatli o‘yin o‘ynang: salomlashish, kutish va ulashishni namuna qiling.',
      'Har kuni yugurish, to‘p, raqs yoki sayr kabi faol o‘yin uchun vaqt ajrating.',
      'Uyqu va dam olish vaqtini bir xil saqlang; toliqishda tinch o‘yin va erta uyquni tanlang.',
      'Ekran o‘rniga rasm, kitob yoki birgalikdagi o‘yinni taklif qiling.',
      'Tarbiyachi bilan haftasiga bir marta qaysi o‘yinlar bolaga yordam berishini muhokama qiling.',
    ],
  },
  en: {
    plan: 'Practical plan for home and preschool',
    tips: [
      'Use a 15–20 minute turn-taking game each day; model greeting, waiting, and sharing.',
      'Make time every day for running, ball games, dancing, or a walk.',
      'Keep sleep and rest times consistent; choose calm play and an earlier bedtime when tired.',
      'Offer drawing, books, or shared play instead of extra screen time.',
      'Have a short weekly check-in with the teacher about what helps the child engage.',
    ],
  },
  ru: {
    plan: 'Практический план для дома и детского сада',
    tips: [
      'Ежедневно играйте 15–20 минут в игру с очередностью; показывайте приветствие, ожидание и обмен игрушками.',
      'Каждый день оставляйте время для бега, мяча, танцев или прогулки.',
      'Соблюдайте постоянное время сна и отдыха; при усталости выбирайте спокойную игру и ранний сон.',
      'Вместо дополнительного экрана предложите рисование, книги или совместную игру.',
      'Раз в неделю обсуждайте с воспитателем, что помогает ребенку включаться.',
    ],
  },
  kz: {
    plan: 'Үй мен балабақшаға арналған практикалық жоспар',
    tips: [
      'Күн сайын 15–20 минут кезектесіп ойнаңыз: амандасу, күту және бөлісуді үлгі етіңіз.',
      'Күн сайын жүгіру, доп, би немесе серуенге уақыт бөліңіз.',
      'Ұйқы мен демалыс уақытын тұрақты ұстаңыз; шаршағанда тыныш ойын мен ерте ұйқыны таңдаңыз.',
      'Қосымша экранның орнына сурет, кітап немесе бірге ойнауды ұсыныңыз.',
      'Аптасына бір рет тәрбиешімен балаға не көмектесетінін талқылаңыз.',
    ],
  },
  ky: {
    plan: 'Үй жана бала бакча үчүн практикалык план',
    tips: [
      'Күн сайын 15–20 мүнөт кезектешип ойноңуз: саламдашуу, күтүү жана бөлүшүүнү көрсөтүңүз.',
      'Күн сайын чуркоо, топ, бий же сейил үчүн убакыт бөлүңүз.',
      'Уйку жана эс алуу убактысын туруктуу кармаңыз; чарчаганда тынч оюн жана эрте уйкуну тандаңыз.',
      'Кошумча экрандын ордуна сүрөт, китеп же бирге ойноону сунуштаңыз.',
      'Аптасына бир жолу тарбиячы менен балага эмне жардам берерин талкуулаңыз.',
    ],
  },
  tg: {
    plan: 'Нақшаи амалӣ барои хона ва кӯдакистон',
    tips: [
      'Ҳар рӯз 15–20 дақиқа навбатдорӣ бозӣ кунед: салом, интизорӣ ва мубодиларо нишон диҳед.',
      'Ҳар рӯз барои давидан, тӯббозӣ, рақс ё сайругашт вақт ҷудо кунед.',
      'Вақти хоб ва истироҳатро мунтазам нигоҳ доред; ҳангоми хастагӣ бозии ором ва хоби барвақтро интихоб кунед.',
      'Ба ҷойи экрани иловагӣ расмкашӣ, китоб ё бозии якҷоя пешниҳод кунед.',
      'Ҳафтае як бор бо мураббӣ чизҳои кӯмаккунандаро муҳокима кунед.',
    ],
  },
  tm: {
    plan: 'Öý we çagalar bagy üçin amaly meýilnama',
    tips: [
      'Her gün 15–20 minut nobatlaşyp oýnaň: salamlaşmagy, garaşmagy we paýlaşmagy görkeziň.',
      'Her gün ylgaw, top, tans ýa-da gezelenç üçin wagt bölüň.',
      'Uky we dynç alyş wagtyny durnukly saklaň; ýadawlykda asuda oýun we irki uky saýlaň.',
      'Goşmaça ekranyň ýerine surat, kitap ýa-da bilelikdäki oýny hödürläň.',
      'Hepdede bir gezek terbiýeçi bilen nämäniň kömek edýändigini maslahatlaşyň.',
    ],
  },
  tr: {
    plan: 'Ev ve okul öncesi için pratik plan',
    tips: [
      'Her gün 15–20 dakika sırayla oynayın; selamlaşmayı, beklemeyi ve paylaşmayı örnekleyin.',
      'Her gün koşma, top, dans veya yürüyüş için zaman ayırın.',
      'Uyku ve dinlenme saatlerini düzenli tutun; yorgunlukta sakin oyun ve erken uyku seçin.',
      'Ek ekran yerine resim, kitap veya birlikte oyun önerin.',
      'Haftada bir öğretmenle çocuğa nelerin yardımcı olduğunu konuşun.',
    ],
  },
};

export const getPlayPreschoolAdvice = (language) =>
  advice[language] ?? advice.en;
