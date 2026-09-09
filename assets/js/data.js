/* =====================================================================
   PROVENANCE — the catalogue
   A small, illustrative dataset. Every piece is tied to one maker and
   one documented technique. No piece exists here without provenance.
   ===================================================================== */

window.PROVENANCE_MAKERS = [
  { name: "Rukmini Devi",     place: "Kutch, India",        craft: "Wood-fired stoneware",        img: "assets/img/maker-1.svg" },
  { name: "Tomás Ramírez",    place: "Chinchero, Peru",     craft: "Backstrap loom weaving",      img: "assets/img/maker-2.svg" },
  { name: "Aïcha Diallo",     place: "Ségou, Mali",         craft: "Coiled straw basketry",       img: "assets/img/maker-3.svg" },
  { name: "Kenji Mori",       place: "Tokushima, Japan",    craft: "Fermented indigo dyeing",     img: "assets/img/maker-4.svg" },
  { name: "Elias Okonkwo",    place: "Awka, Nigeria",       craft: "Adze wood carving",           img: "assets/img/maker-5.svg" },
  { name: "Mariam Petrosyan", place: "Yerevan, Armenia",    craft: "Silver filigree",             img: "assets/img/maker-6.svg" },
  { name: "Zahra Ahmadi",     place: "Kerman, Iran",        craft: "Hand-knotted wool rugs",      img: "assets/img/maker-7.svg" },
  { name: "Sok Chenda",       place: "Siem Reap, Cambodia", craft: "Layered urushi lacquer",      img: "assets/img/maker-8.svg" }
];

/* verification markers: pv = process video verified, ce = community/cooperative endorsed, vr = verified region of origin */
window.PROVENANCE_PIECES = [
  { t: "Ash-Glazed Storage Jar",        m: "Rukmini Devi",     p: "Kutch, India",        yrs: 22, tech: "Wheel-thrown, wood-fired", price: "£480",   fmt: "Static · process video", tags: "ceramics", marks: ["pv","vr"],       img: "assets/img/piece-vessel.svg" },
  { t: "Backstrap Blanket, Nº7",        m: "Tomás Ramírez",    p: "Chinchero, Peru",     yrs: 31, tech: "Backstrap loom, cochineal", price: "£640",   fmt: "Static · process video", tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-textile.svg" },
  { t: "Coiled Rye Basket",             m: "Aïcha Diallo",     p: "Ségou, Mali",         yrs: 17, tech: "Coiled millet straw",      price: "£210",   fmt: "Short-form video",       tags: "basketry", marks: ["vr"],            img: "assets/img/piece-basket.svg" },
  { t: "Itajime Indigo Cloth",          m: "Kenji Mori",       p: "Tokushima, Japan",    yrs: 40, tech: "Board-clamp resist, indigo", price: "£390", fmt: "Static · process video", tags: "textiles", marks: ["pv","ce","vr"],  img: "assets/img/piece-indigo.svg" },
  { t: "Camphor Serving Bowl",          m: "Elias Okonkwo",    p: "Awka, Nigeria",       yrs: 12, tech: "Adze-carved camphor",      price: "£280",   fmt: "Live selling session",   tags: "woodwork", marks: ["ce"],            img: "assets/img/piece-carving.svg" },
  { t: "Filigree Pendant, Pomegranate", m: "Mariam Petrosyan", p: "Yerevan, Armenia",    yrs: 26, tech: "Hand-drawn silver filigree", price: "£520", fmt: "Static · process video", tags: "metal",    marks: ["pv","vr"],       img: "assets/img/piece-silver.svg" },
  { t: "Knotted Highland Rug",          m: "Zahra Ahmadi",     p: "Kerman, Iran",        yrs: 19, tech: "Hand-knotted wool, madder", price: "£1,240", fmt: "Static · process video", tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-rug.svg" },
  { t: "Negoro Lacquer Bowl",           m: "Sok Chenda",       p: "Siem Reap, Cambodia", yrs: 15, tech: "Thirty layers of urushi",  price: "£330",   fmt: "Short-form video",       tags: "lacquer",  marks: ["pv","vr"],       img: "assets/img/piece-lacquer.svg" },

  { t: "Tea Jar with Iron Slip",        m: "Rukmini Devi",     p: "Kutch, India",        yrs: 22, tech: "Wheel-thrown, wood-fired", price: "£360",   fmt: "Static · process video", tags: "ceramics", marks: ["pv","vr"],       img: "assets/img/piece-vessel.svg" },
  { t: "Ceremonial Manta Cloth",        m: "Tomás Ramírez",    p: "Chinchero, Peru",     yrs: 31, tech: "Backstrap loom, indigo",   price: "£880",   fmt: "Live selling session",   tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-textile.svg" },
  { t: "Lidded Grain Basket",           m: "Aïcha Diallo",     p: "Ségou, Mali",         yrs: 17, tech: "Coiled straw, leather rim", price: "£240",   fmt: "Short-form video",       tags: "basketry", marks: ["ce","vr"],       img: "assets/img/piece-basket.svg" },
  { t: "Indigo Noren Panel",            m: "Kenji Mori",       p: "Tokushima, Japan",    yrs: 40, tech: "Katazome stencil, indigo",  price: "£450",   fmt: "Static · process video", tags: "textiles", marks: ["pv","vr"],       img: "assets/img/piece-indigo.svg" },
  { t: "Carved Oil Dish, Pair",         m: "Elias Okonkwo",    p: "Awka, Nigeria",       yrs: 12, tech: "Adze-carved camphor",      price: "£190",   fmt: "Short-form video",       tags: "woodwork", marks: ["ce"],            img: "assets/img/piece-carving.svg" },
  { t: "Filigree Cuff, Vine",           m: "Mariam Petrosyan", p: "Yerevan, Armenia",    yrs: 26, tech: "Hand-drawn silver filigree", price: "£610", fmt: "Static · process video", tags: "metal",    marks: ["pv","vr"],       img: "assets/img/piece-silver.svg" },
  { t: "Runner Rug, Garden Border",     m: "Zahra Ahmadi",     p: "Kerman, Iran",        yrs: 19, tech: "Hand-knotted wool",        price: "£720",   fmt: "Static · process video", tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-rug.svg" },
  { t: "Lacquer Offering Tray",         m: "Sok Chenda",       p: "Siem Reap, Cambodia", yrs: 15, tech: "Layered urushi, gold motif", price: "£420",  fmt: "Live selling session",   tags: "lacquer",  marks: ["pv","ce","vr"],  img: "assets/img/piece-lacquer.svg" },
  { t: "Water Pitcher, Salt Glaze",     m: "Rukmini Devi",     p: "Kutch, India",        yrs: 22, tech: "Wheel-thrown, salt-fired", price: "£300",   fmt: "Short-form video",       tags: "ceramics", marks: ["pv","vr"],       img: "assets/img/piece-vessel.svg" },

  { t: "Belt Sash, Zigzag",             m: "Tomás Ramírez",    p: "Chinchero, Peru",     yrs: 31, tech: "Backstrap loom, alpaca",   price: "£260",   fmt: "Short-form video",       tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-textile.svg" },
  { t: "Winnowing Tray",                m: "Aïcha Diallo",     p: "Ségou, Mali",         yrs: 17, tech: "Coiled straw, open weave",  price: "£150",   fmt: "Short-form video",       tags: "basketry", marks: ["vr"],            img: "assets/img/piece-basket.svg" },
  { t: "Sashiko Indigo Throw",          m: "Kenji Mori",       p: "Tokushima, Japan",    yrs: 40, tech: "Indigo, hand running-stitch", price: "£560", fmt: "Static · process video", tags: "textiles", marks: ["pv","ce","vr"],  img: "assets/img/piece-indigo.svg" },
  { t: "Ancestor Figure, Small",        m: "Elias Okonkwo",    p: "Awka, Nigeria",       yrs: 12, tech: "Carved iroko, beeswax",    price: "£340",   fmt: "Live selling session",   tags: "woodwork", marks: ["ce"],            img: "assets/img/piece-carving.svg" },
  { t: "Filigree Earrings, Dew",        m: "Mariam Petrosyan", p: "Yerevan, Armenia",    yrs: 26, tech: "Hand-drawn silver filigree", price: "£280", fmt: "Short-form video",       tags: "metal",    marks: ["pv","vr"],       img: "assets/img/piece-silver.svg" },
  { t: "Sleeping Rug, Tribal",          m: "Zahra Ahmadi",     p: "Kerman, Iran",        yrs: 19, tech: "Hand-knotted wool, walnut", price: "£980",  fmt: "Static · process video", tags: "textiles", marks: ["ce","vr"],       img: "assets/img/piece-rug.svg" },
  { t: "Stacking Lacquer Boxes",        m: "Sok Chenda",       p: "Siem Reap, Cambodia", yrs: 15, tech: "Layered urushi on bamboo",  price: "£510",  fmt: "Static · process video", tags: "lacquer",  marks: ["pv","vr"],       img: "assets/img/piece-lacquer.svg" }
];
