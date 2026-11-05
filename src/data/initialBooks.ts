import { BookRecord } from '../types/book';

export const INITIAL_BOOKS: BookRecord[] = [
  {
    id: 'book-1',
    sl: 1,
    bookName: 'স্বাস্থ্য সহকারী নিয়োগ সহায়িকা',
    adCost: 30,
    makingCost: 250,
    perBookAmount: 390,
    profitPerBook: 110,
    totalOrderFaridBhai: 5000,
    pressDailyReceipts: {
      1: 283,
      2: 1000,
      3: 1000,
    },
    boibari: {
      1: 1245,
      2: 5,
    },
    rokomari: {
      1: 5,
      2: 20,
    },
    wafilife: {
      1: 1,
      2: 30,
    },
    othersOnline: {
      1: 6,
      2: 6,
    },
    headOfficeSellOffline: {
      1: 1,
      2: 2,
    },
    nilkhetLibrary: {
      1: 1,
      2: 4,
    },
    sumonaLibrary: {
      1: 200,
      2: 2,
    },
    promiseLibrary: {
      1: 50,
      2: 5,
    },
    joystarLibrary: {
      1: 50,
      2: 2,
    },
    dailyReturns: {
      1: 50,
      2: 2,
      3: 5,
    },
    marketing: 2,
    service: 2,
    adVideoMaking: 2,
    rd: 2,
    gift: 2,
    remarks: 'প্রথম সংস্করণ - দ্রুত বিক্রি হচ্ছে',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book-2',
    sl: 2,
    bookName: '৪৬তম বিসিএস প্রিলিমিনারি ডাইজেস্ট',
    adCost: 40,
    makingCost: 320,
    perBookAmount: 520,
    profitPerBook: 160,
    totalOrderFaridBhai: 8000,
    pressDailyReceipts: {
      1: 1500,
      2: 2000,
      4: 1000,
    },
    boibari: {
      1: 850,
      2: 620,
      3: 180,
    },
    rokomari: {
      1: 120,
      2: 150,
      3: 45,
    },
    wafilife: {
      1: 80,
      2: 95,
      3: 25,
    },
    othersOnline: {
      1: 30,
      2: 40,
    },
    headOfficeSellOffline: {
      1: 25,
      2: 35,
      3: 10,
    },
    nilkhetLibrary: {
      1: 80,
      2: 120,
    },
    sumonaLibrary: {
      1: 350,
      2: 150,
    },
    promiseLibrary: {
      1: 100,
      2: 80,
    },
    joystarLibrary: {
      1: 75,
      2: 60,
    },
    dailyReturns: {
      2: 15,
      5: 10,
    },
    marketing: 5,
    service: 3,
    adVideoMaking: 4,
    rd: 3,
    gift: 5,
    remarks: 'বিসিএস পরীক্ষার্থীদের জন্য সর্বাধিক বিক্রিত',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book-3',
    sl: 3,
    bookName: 'প্রাথমিক সহকারী শিক্ষক নিয়োগ চূড়ান্ত প্রস্তুতি',
    adCost: 35,
    makingCost: 280,
    perBookAmount: 450,
    profitPerBook: 135,
    totalOrderFaridBhai: 6000,
    pressDailyReceipts: {
      1: 1200,
      2: 1500,
    },
    boibari: {
      1: 600,
      2: 450,
    },
    rokomari: {
      1: 90,
      2: 80,
    },
    wafilife: {
      1: 45,
      2: 50,
    },
    othersOnline: {
      1: 20,
      2: 25,
    },
    headOfficeSellOffline: {
      1: 15,
      2: 20,
    },
    nilkhetLibrary: {
      1: 60,
      2: 90,
    },
    sumonaLibrary: {
      1: 220,
      2: 100,
    },
    promiseLibrary: {
      1: 80,
      2: 60,
    },
    joystarLibrary: {
      1: 50,
      2: 40,
    },
    dailyReturns: {
      3: 12,
    },
    marketing: 3,
    service: 2,
    adVideoMaking: 2,
    rd: 2,
    gift: 3,
    remarks: 'প্রাইমারি সার্কুলার উপলক্ষে হট সেলিং বই',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book-4',
    sl: 4,
    bookName: '১৮তম শিক্ষক নিবন্ধন (NTRCA) স্পেশাল গাইড',
    adCost: 25,
    makingCost: 230,
    perBookAmount: 380,
    profitPerBook: 125,
    totalOrderFaridBhai: 4000,
    pressDailyReceipts: {
      1: 800,
      2: 1000,
    },
    boibari: {
      1: 400,
      2: 300,
    },
    rokomari: {
      1: 50,
      2: 60,
    },
    wafilife: {
      1: 30,
      2: 40,
    },
    othersOnline: {
      1: 15,
      2: 20,
    },
    headOfficeSellOffline: {
      1: 10,
      2: 15,
    },
    nilkhetLibrary: {
      1: 40,
      2: 50,
    },
    sumonaLibrary: {
      1: 150,
      2: 80,
    },
    promiseLibrary: {
      1: 50,
      2: 40,
    },
    joystarLibrary: {
      1: 30,
      2: 35,
    },
    dailyReturns: {
      4: 8,
    },
    marketing: 2,
    service: 2,
    adVideoMaking: 1,
    rd: 2,
    gift: 2,
    remarks: 'কলেজ ও স্কুল উভয় পর্যায়ের জন্য',
    updatedAt: new Date().toISOString(),
  },
];
