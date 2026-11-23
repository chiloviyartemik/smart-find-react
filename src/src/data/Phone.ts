export interface Phone {
  id: number;
  name: string;
  tags: string[];
  characteristics: string;
  img: string;
  price: number;
  link: string;
  priceUpdatedAt?: string;
}

export const phonesData: Phone[] = [
  {
    id: 1,
    name: "OnePlus 13 CN",
    tags: [
      "sale",
      "balans",
      "autonomy",
      "game",
      "snap",
      "fastcharge",
      "material",
      "ip",
      "scan",
      "global",
      "gps",
      "esim",
      "tp",
    ],
    characteristics:
      "Дисплей: 6.82 AMOLED - 1440 x 3168<br>Чип: Qualcomm Snapdragon 8 Elite<br>Камера: 3 (50 MP + 50 MP + 50 MP)<br>Батарея: 6000 мАч<br>OS: Android 16<br>Вес: 213 г",
    img: "img/OnePlus13.png",
    price: 40000,
    link: "https://nanoreview.net/ru/phone/oneplus-13",
  },
  {
    id: 2,
    name: "POCO F8 Ultra",
    tags: [
      "balans",
      "autonomy",
      "game",
      "snap",
      "fastcharge",
      "material",
      "ip",
      "scan",
      "cn",
      "tp",
    ],
    characteristics:
      "Дисплей: 6.9 AMOLED - 1200 x 2608<br>Чип: Qualcomm Snapdragon 8 Elite Gen 5<br>Камера: 3 (50 MP + 50 MP + 50 MP)<br>Батарея: 6500 мАч<br>OS: Android 16<br>Вес: 218",
    img: "img/POCOF8Ultra.png",
    price: 53111,
    link: "https://nanoreview.net/ru/phone/xiaomi-poco-f8-ultra",
    priceUpdatedAt: "17.09.26",
  },
];
