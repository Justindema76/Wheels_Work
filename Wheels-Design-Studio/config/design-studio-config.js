window.WHEELS_DESIGN_CONFIG = {
  version: 1,
  production: {
    emailEndpoint: "",
    recipientEmail: "",
    ccEmail: "",
    subjectPrefix: "Wheels Design Studio",
    maxUploadMb: 25
  },
  typography: {
    fontSizes: [12,14,16,18,20,22,24,26,28,30,32,36,40,44,48,54,60,72]
  },
  screenPrint: {
    maxColours: 2,
    colours: [
      {name:"HT Process Black", hex:"#000000"},
      {name:"HT Process Cyan", hex:"#00AEEF"},
      {name:"HT Process Magenta", hex:"#EC008C"},
      {name:"HT Process Yellow", hex:"#FFF200"},
      {name:"Grey 429 C", hex:"#ADADAD"},
      {name:"Silver / Clear", hex:"#C0C0C0"},
      {name:"Gold / Clear", hex:"#D4AF37"},
      {name:"White", hex:"#FFFFFF"},
      {name:"Black", hex:"#000000"},
      {name:"Process Blue", hex:"#008CCC"},
      {name:"Reflex Blue", hex:"#171796"},
      {name:"Violet C", hex:"#6600A1"},
      {name:"Purple C", hex:"#BA1FB5"},
      {name:"Rhodamine Red", hex:"#E60094"},
      {name:"Rubine Red", hex:"#CF035C"},
      {name:"Orange 021 C", hex:"#ED6E00"},
      {name:"Bright Orange", hex:"#FF5E00"},
      {name:"Warm Red", hex:"#F54029"},
      {name:"Fire Red", hex:"#D71920"},
      {name:"Emerald Green (355 C)", hex:"#009645"},
      {name:"Green C", hex:"#00B394"},
      {name:"Medium Yellow (116 C)", hex:"#F7D117"},
      {name:"Primrose Yellow (101 C)", hex:"#F5ED59"},
      {name:"Yellow C", hex:"#F7E017"}
    ]
  },
  products: {
    plateSign: {enabled:true, label:"Plate Sign Designer", screenPrint:true, digital:true},
    motorcycle: {enabled:true, label:"Motorcycle Plate Cover Designer", screenPrint:true, digital:true},
    lexan: {enabled:true, label:"Lexan Plate Cover Designer", screenPrint:true, digital:true},
    plateFrame: {enabled:true, label:"Licence Plate Frame Designer", screenPrint:true, digital:true}
  }
};
