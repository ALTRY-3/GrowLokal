"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useWishlist } from "@/lib/useWishlist";

// Default profile picture SVG as data URL
const DEFAULT_PROFILE_PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23e8d5b7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23d4b896;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='200' height='200'/%3E%3Ccircle cx='100' cy='80' r='35' fill='%23af7928'/%3E%3Cpath d='M100 120 C70 120, 40 130, 30 160 L170 160 C160 130, 130 120, 100 120 Z' fill='%23af7928'/%3E%3C/svg%3E";
import Footer from "@/components/Footer";
import "./profile.css";
import {
  FaEdit,
  FaUser,
  FaShoppingCart,
  FaTags,
  FaSearch,
  FaImage,
  FaStore,
  FaBoxOpen,
  FaHeart,
  FaSave,
} from "react-icons/fa";

const regionList = [
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Cordillera Administrative Region (CAR)",
  "NCR (Metro Manila)",
];

// Replace the existing regionProvinceCityData with the complete version
const regionProvinceCityData: Record<string, Record<string, string[]>> = {
  "Ilocos Region (Region I)": {
    "Ilocos Nortere": ["Laoag", "Batac"],
    "Ilocos Sur": ["Vigan", "Candon"],
    "La Union": ["San Fernando", "Agoo"],
    Pangasinan: ["Dagupan", "San Carlos", "Alaminos", "Urdaneta"],
  },
  "Cagayan Valley (Region II)": {
    Batanes: ["Basco", "Itbayat"],
    Cagayan: ["Tuguegarao", "Cauayan"],
  },
  "Central Luzon (Region III)": {
    Aurora: [
      "Baler",
      "Casiguran",
      "Dilasag",
      "Dinalungan",
      "Dipaculao",
      "Maria Aurora",
    ],
    Bataan: [
      "Abucay",
      "Bagac",
      "Balanga",
      "Hermosa",
      "Limay",
      "Mariveles",
      "Morong",
      "Orani",
      "Orion",
      "Pilar",
      "Samal",
    ],
    Bulacan: [
      "Angat",
      "Balagtas",
      "Baliuag",
      "Bocaue",
      "Bulacan",
      "Bustos",
      "Calumpit",
      "Doña Remedios Trinidad",
      "Guiguinto",
      "Hagonoy",
      "Malolos",
      "Marilao",
      "Meycauayan",
      "Norzagaray",
      "Obando",
      "Pandi",
      "Plaridel",
      "Pulilan",
      "San Ildefonso",
      "San Jose del Monte",
      "San Miguel, Bulacan",
      "San Rafael",
      "Santa Maria",
    ],
    "Nueva Ecija": ["Cabanatuan", "Gapan", "San Jose, Nueva Ecija"],
    Pampanga: [
      "Angeles",
      "Apalit",
      "Arayat",
      "Bacolor",
      "Candaba",
      "Floridablanca",
      "Guagua",
      "Lubao",
      "Macabebe",
      "Mabalacat",
      "Magalang",
      "Masantol",
      "Mexico",
      "Minalin",
      "Porac",
      "San Fernando",
      "San Luis",
      "San Simon",
      "Santa Ana",
      "Santa Rita",
      "Santo Tomas",
      "Sasmuan",
    ],
    Tarlac: [
      "Anao",
      "Bamban",
      "Camiling",
      "Capas",
      "Concepcion",
      "Gerona",
      "La Paz",
      "Mayantoc",
      "Moncada",
      "Paniqui",
      "Pura",
      "Ramos",
      "San Clemente",
      "San Jose, Tarlac",
      "San Manuel",
      "Santa Ignacia",
      "Tarlac City",
      "Victoria",
    ],
    Zambales: [
      "Botolan",
      "Cabangan",
      "Candelaria",
      "Castillejos",
      "Iba",
      "Masinloc",
      "Olongapo",
      "Palauig",
      "San Antonio",
      "San Felipe",
      "San Marcelino",
      "San Narciso",
      "Subic",
      "Sta. Cruz",
    ],
  },
  "CALABARZON (Region IV-A)": {
    Batangas: ["Batangas City", "Lipa", "Tanauan"],
    Cavite: ["Bacoor", "Cavite City", "Imus"],
    Laguna: ["Calamba", "San Pablo", "Santa Rosa"],
    Quezon: ["Candelaria", "Lucena", "Tayabas"],
    Rizal: ["Antipolo", "Cainta", "Taytay"],
  },
  "MIMAROPA (Region IV-B)": {
    Marinduque: ["Boac", "Mogpog"],
    Occidental: ["Mamburao", "San Jose"],
    Oriental: ["Baco", "Calapan"],
    Palawan: ["El Nido", "Puerto Princesa"],
    Romblon: ["Odiongan", "Romblon"],
  },
  "Bicol Region (Region V)": {
    Albay: ["Legazpi", "Tabaco"],
    "Camarines Norte": ["Daet", "Labo"],
    "Camarines Sur": ["Iriga", "Naga"],
    Catanduanes: ["San Andres", "Virac"],
    Masbate: ["Aroroy", "Masbate City"],
    Sorsogon: ["Bulusan", "Sorsogon City"],
  },
  "Cordillera Administrative Region (CAR)": {
    Abra: ["Bangued", "Tayum"],
    Apayao: ["Conner", "Kabugao"],
    Benguet: ["Baguio", "La Trinidad"],
    Ifugao: ["Kiangan", "Lagawe"],
    Kalinga: ["Lubuagan", "Tabuk"],
    Mountain: ["Barlig", "Bontoc"],
  },
  "NCR (Metro Manila)": {
    "Metro Manila": [
      "Caloocan",
      "Las Piñas",
      "Makati",
      "Malabon",
      "Manila",
      "Mandaluyong",
      "Marikina",
      "Muntinlupa",
      "Navotas",
      "Parañaque",
      "Pasay",
      "Pasig",
      "Pateros",
      "Quezon City",
      "San Juan",
      "Taguig",
      "Valenzuela",
    ],
  },
};

const luzonRegions = [
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Cordillera Administrative Region (CAR)",
  "National Capital Region (NCR)",
];

const cityBarangayData: Record<string, string[]> = {
  Olongapo: [
    "Asinan",
    "Banicain",
    "Barretto",
    "East Bajac-Bajac",
    "East Tapinac",
    "Gordon Heights",
    "Kalaklan",
    "Mabayuan",
    "New Cabalan",
    "New Ilalim",
    "New Kababae",
    "New Kalalake",
    "Old Cabalan",
    "Pag-asa",
    "Santa Rita",
    "West Bajac-Bajac",
    "West Tapinac",
  ],
  Iba: [
    "Balaybay",
    "Binocboc",
    "Boton",
    "Buhangin",
    "Canaan",
    "Calabasa",
    "Casupanan",
    "Gulod",
    "Masinloc",
    "Pantalan",
    "Poblacion",
    "San Vicente",
    "Sapang Uwak",
    "Tondo",
  ],
  Subic: [
    "Binictican",
    "Barangay 1",
    "Barangay 2",
    "Barangay 3",
    "Barangay 4",
    "Barangay 5",
    "Barangay 6",
    "Barangay 7",
    "Barangay 8",
    "Barangay 9",
    "Barangay 10",
    "Barangay 11",
    "Barangay 12",
    "Barangay 13",
    "Barangay 14",
    "Barangay 15",
    "Barangay 16",
    "Barangay 17",
    "Barangay 18",
  ],
  "San Antonio": [
    "Aplaya",
    "Bagbaguin",
    "Banban",
    "Camangyanan",
    "Labney",
    "Nagbacalan",
    "Poblacion I",
    "Poblacion II",
    "Poblacion III",
    "San Francisco",
    "San Gabriel",
    "San Jose",
    "San Rafael",
    "Santa Cruz",
  ],
  "San Felipe": [
    "Bagacay",
    "Balogo",
    "Bulo",
    "Camachin",
    "Canaynayan",
    "Dangcol",
    "La Paz",
    "Liwanag",
    "Mabanggot",
    "Poblacion I",
    "Poblacion II",
    "San Juan",
    "San Jose",
    "San Vicente",
  ],
  "San Marcelino": [
    "Alat",
    "Bagong Silang",
    "Banaybanay",
    "Banog",
    "Binabalian",
    "Buenavista",
    "Canomay",
    "Capayawan",
    "Concepcion",
    "Don Pedro",
    "Liwanag",
    "Loma de Gato",
    "Maloma",
    "Mambog",
    "Poblacion I",
    "Poblacion II",
    "San Miguel, San Marcelino",
    "San Roque",
    "Santa Maria",
  ],
  "San Narciso": [
    "Aplaya",
    "Bagacayan",
    "Bagumbayan",
    "Balaybay",
    "Banaag",
    "Banot",
    "Bayabas",
    "Camachin",
    "Dila-dila",
    "Gugo",
    "Linao",
    "Poblacion",
    "San Juan",
    "San Pablo",
    "San Pedro",
    "Santa Rita",
  ],
  Castillejos: [
    "Alasasin",
    "Bagong Silang",
    "Bahay Bato",
    "Bamban",
    "Binabalian",
    "Cabatuhan",
    "Lamao",
    "Mabayo",
    "Maniboc",
    "Poblacion I",
    "Poblacion II",
    "San Juan",
    "San Jose",
    "San Pablo",
    "Santa Isabel",
  ],
  Botolan: [
    "Bamban",
    "Bani",
    "Binaliw",
    "Cabugao",
    "Casilagan",
    "Dacanlao",
    "Looc",
    "Maguisguis",
    "Malabon",
    "Poblacion",
    "San Isidro",
    "San Jose",
    "San Rafael",
    "Santa Fe",
    "Santa Maria",
  ],
  Candelaria: [
    "Bagumbayan",
    "Banban",
    "Baytan",
    "Calapacuan",
    "Camachin",
    "Caparangan",
    "Gugo",
    "Maniboc",
    "Poblacion",
    "San Antonio",
    "San Roque",
    "Santa Cruz",
  ],
  Masinloc: [
    "Apoongan",
    "Balog",
    "Banaban",
    "Baragay",
    "Binabalian",
    "Camangyanan",
    "Casanayan",
    "Daniw",
    "Doliman",
    "Hulo",
    "Iba",
    "Libato",
    "Lusong",
    "Mabini",
    "Mabilog",
    "Magahis",
    "Poblacion",
    "San Antonio",
    "San Juan",
    "San Roque",
  ],
  Palauig: [
    "Alili",
    "Anilao",
    "Bagong Silang",
    "Balogo",
    "Bani",
    "Binabalian",
    "Cabangahan",
    "Concepcion",
    "Malabon",
    "Poblacion",
    "San Roque",
    "Santa Cruz",
  ],
  Cabangan: [
    "Bagong Silang",
    "Bamban",
    "Banaybanay",
    "Calangcang",
    "Candelaria",
    "Concepcion",
    "Dila-dila",
    "Liwanag",
    "Malabon",
    "Poblacion",
    "San Agustin",
    "San Jose",
    "San Juan",
    "San Roque",
    "Santa Maria",
  ],
  "Sta. Cruz": [
    "Bagumbayan",
    "Baluti",
    "Bayto",
    "Binabalian",
    "Bulo",
    "Candelaria",
    "Carmen",
    "Concepcion",
    "Poblacion",
    "San Isidro",
    "San Juan",
    "San Miguel, Sta. Cruz",
    "Santa Rita",
  ],
  Baler: [
    "Agos",
    "Alisto",
    "Balaoan",
    "Baler (Centro)",
    "Calabgan",
    "Caliang",
    "Carangalan",
    "Catedr",
    "Dila",
    "Filan",
    "Lal-lo",
    "San Isidro",
    "Sabag",
  ],
  Casiguran: [
    "Aguang",
    "Aledanan",
    "Bato-Bato",
    "Bobonao",
    "Bulaoen",
    "Burabod",
    "Calaocan",
    "Culalabo",
    "Dila",
    "Dianao",
    "Estete",
    "Guilayon",
    "Ipil",
    "Lagingdang",
    "Lozoya",
    "Mabuo",
    "Manalop",
    "Mapalad",
    "Nabato",
    "Olna",
    "Pamalayan",
    "Pinihan",
    "Progress",
    "Sta. Maria",
  ],
  Dilasag: [
    "Aguisic",
    "Bayabas",
    "Benito",
    "Buenavista",
    "Casapsapan",
    "Estanza",
    "Laserna",
    "Lianzo",
    "Mangga",
    "Masi",
    "San Isidro",
  ],
  Dinalungan: [
    "Bayanihan",
    "Bato",
    "Caingin",
    "Casacruzan",
    "Dinalungan (Poblacion)",
    "Laboy",
    "Macatbag",
    "Marikit",
    "Palale",
  ],
  Dipaculao: [
    "Bayabas",
    "Borlongan",
    "Buenavista",
    "Calaocan",
    "Diamanen",
    "Dianed",
    "Diarabasin",
    "Dibutunan",
    "Dimabuno",
    "Dinadiawan",
    "Ditale",
    "Gupa",
    "Ipil",
    "Laboy",
    "Lipit",
    "Lobbot",
    "Maligaya",
    "Mijares",
    "Mucdol",
    "North Poblacion",
    "Puangi",
    "Salay",
    "Sapangkawayan",
    "South Poblacion",
    "Toytoyan",
  ],
  "Maria Aurora": [
    "Bantigue",
    "Bayanihan",
    "Berima",
    "Bigaan",
    "Bulalan",
    "Cabog",
    "Calitas",
    "Canili",
    "Cantel",
    "Casay",
    "Cawayanan",
    "Central",
    "Comon",
    "Daganas",
    "Dalisay",
    "Diteki",
    "Diya",
    "Dolores",
    "Estebangan",
    "Ilijan",
    "Lab",
    "Linlag",
    "Litlit",
    "Lobban",
    "Maliglig",
    "Maragol",
    "Masagana",
    "Mataragan",
    "Masiyan",
    "Minalung",
    "Narra",
    "Palali",
    "Pingit",
    "Pugu",
    "Quinabasan",
    "San Jose",
    "San Rafael",
    "Saguinsing",
    "Tagyan",
    "Villa Maria",
  ],
  Balanga: [
    "Bagong Silang",
    "Bagumbayan",
    "Camacho",
    "Cataning",
    "Central",
    "Cupang North",
    "Cupang Proper",
    "Cupang West",
    "Dangcol (Bernabe)",
    "Doña Francisca",
    "Ibayo",
    "Malabia",
    "Munting Batangas (Cadre)",
    "Poblacion Barcenas",
    "Puerto Rivas Ibaba",
    "Puerto Rivas Itaas",
    "Puerto Rivas Lote",
    "San Jose",
    "Sibacan",
    "Talisay",
    "Tanato",
    "Tenejero",
    "Tortugas",
    "Tuyo",
  ],
  Abucay: [
    "Bangkal",
    "Calaylayan (Poblacion)",
    "Capitangan",
    "Gabon",
    "Laon (Poblacion)",
    "Mabatang",
    "Omboy",
    "Salian",
    "Wawa (Poblacion)",
  ],
  Bagac: [
    "Atilano L. Ricardo",
    "Bagumbayan (Poblacion)",
    "Banawang",
    "Binuangan",
    "Binukawan",
    "Ibaba (Poblacion)",
    "Ibis",
    "Pag-asa (Wawa-Sibacan)",
    "Parang",
    "Paysawan",
    "Quinawan",
    "San Antonio",
    "Saysain",
    "Tabing-Ilog (Poblacion)",
  ],
  Dinalupihan: [
    "Bangal",
    "Bonifacio (Pob.)",
    "Burgos (Pob.)",
    "Colo",
    "Daang Bago",
    "Dalao",
    "Del Pilar (Pob.)",
    "Gen. Luna (Pob.)",
    "Gomez (Pob.)",
    "Happy Valley",
    "Kataasan",
    "Layac",
    "Luacan",
    "Mabini Proper (Pob.)",
    "Mabini Ext. (Pob.)",
    "Magsaysay Street",
    "Naparing",
    "New San Jose",
    "Old San Jose",
    "Padre Dandan (Pob.)",
    "Pag-asa",
    "Pagalanggang",
    "Pentor",
    "Pinulot",
    "Pita",
    "Rizal (Pob.)",
    "Roosevelt",
    "Roxas (Pob.)",
    "Saguing",
    "San Benito",
    "San Isidro (Pob.)",
    "San Pablo (Bulate)",
    "San Ramon",
    "San Simon",
    "Santo Niño",
    "Sapang Balas",
    "Tabacan",
    "Torres Bugauen (Pob.)",
    "Tucop",
    "Zamora (Pob.)",
    "Aquino",
    "Bayan-Bayanan",
    "Maligaya",
    "Payangan",
    "Tubo-tubo",
    "Jose C. Payumo, Jr.",
  ],
  Hermosa: [
    "A. Rivera (Pob.)",
    "Almacen",
    "Bacong",
    "Balsic",
    "Bamban",
    "Burgos-Soliman (Pob.)",
    "Cataning (Pob.)",
    "Culis",
    "Daungan (Pob.)",
    "Mabiga",
    "Mabuco",
    "Maite",
    "Magsaysay (Pob.)",
    "Mambog - Mandama",
    "Palihan",
    "Pandatung",
    "Pulo",
    "Saba",
    "San Pedro (Pob.)",
    "Santo Cristo",
    "Sumalo",
    "Tipo",
    "Judge Roman Cruz Sr. (Mandama)",
    "Sacrifice Valley",
  ],
  Limay: [
    "Duale",
    "Kitang 2 & Luz",
    "Kitang I",
    "Lamao",
    "Poblacion",
    "Saint Francis II",
    "Townsite",
    "Wawa",
  ],
  Mariveles: [
    "Alas-asin",
    "Alion",
    "Balon-Anito",
    "Baseco Country",
    "Batangas II",
    "Biaan",
    "Cabcaben",
    "Camaya",
    "Ipag",
    "Lucanin",
    "Malaya",
    "Maligaya",
    "Mt. View",
    "Poblacion",
    "San Carlos",
    "San Isidro",
    "Sisiman",
    "Townsite",
  ],
  Morong: ["Binaritan", "Mabayo", "Nagbalayong", "Poblacion", "Sabang"],
  Orani: [
    "Apollo",
    "Bagong Paraiso",
    "Balut",
    "Bayan",
    "Calero",
    "Centro I",
    "Centro II",
    "Dona",
    "Kabalutan",
    "Kaparangan",
    "Maria Fe",
    "Masantol",
    "Mulawin",
    "Pag-asa",
    "Paking-Carbonero",
    "Palihan",
    "Pantalan Bago",
    "Pantalan Luma",
    "Parang Parang",
    "Puksuan",
    "Sibul",
    "Silahis",
    "Tagumpay",
    "Tala",
    "Talimundoc",
    "Tapulao",
    "Tenejero",
    "Tugatog",
    "Wawa",
  ],
  Orion: [
    "Arellano",
    "Bagumbayan",
    "Balagtas",
    "Balut",
    "Bantan",
    "Bilolo",
    "Calungusan",
    "Camachile",
    "Daang Bago",
    "Daang Bilolo",
    "Daang Pare",
    "General Lim",
    "Kapunitan",
    "Lati",
    "Lusungan",
    "Puting Buhangin",
    "Sabatan",
    "San Vicente",
    "Santa Elena",
    "Santo Domingo",
    "Villa Angeles",
    "Wakas",
    "Wawa",
  ],
  Pilar: [
    "Ala-uli",
    "Bagumbayan",
    "Balut I",
    "Balut II",
    "Bantan Munti",
    "Burgos",
    "Del Rosario",
    "Diwa",
    "Landing",
    "Liyang",
    "Nagwaling",
    "Panilao",
    "Pantingan",
    "Poblacion",
    "Rizal",
    "Santa Rosa",
    "Wakas North",
    "Wakas South",
    "Wawa",
  ],
  Samal: [
    "East Calaguiman",
    "East Daang Bago",
    "Gugo",
    "Ibaba",
    "Imelda",
    "Lalawigan",
    "Palili",
    "San Juan",
    "San Roque",
    "Santa Lucia",
    "Sapa",
    "Tabing Ilog",
    "West Calaguiman",
    "West Daang Bago",
  ],
  Cabanatuan: [
    "Aduas Centro",
    "Aduas Norte",
    "Aduas Sur",
    "Bagong Buhay",
    "Bagong Sikat",
    "Bakero",
    "Bakod Bayan",
    "Balite",
    "Bangad",
    "Bantug Bulalo",
    "Bantug Norte",
    "Barlis",
    "Barrera District",
    "Bernardo District",
    "Bitas",
    "Bonifacio District",
    "Buliran",
    "Caalibangbangan",
    "Cabu",
    "Calawagan",
    "Campo Tinio",
    "Caridad",
    "Caudillo",
    "Cinco-Cinco",
    "City Supermarket",
    "Communal",
    "Cruz Roja",
    "Daang Sarile",
    "Dalampang",
    "Dicarma",
    "Dimasalang",
    "Dionisio S. Garcia",
    "Fatima",
    "General Luna",
    "Hermogenes C. Concepcion, Sr.",
    "Ibabao Bana",
    "Imelda District",
    "Isla",
    "Kalikid Norte",
    "Kalikid Sur",
    "Kapitan Pepe",
    "Lagare",
    "Lourdes",
    "M. S. Garcia",
    "Mabini Extension",
    "Mabini Homesite",
    "Macatbong",
    "Magsaysay District",
    "Magsaysay South",
    "Maria Theresa",
    "Matadero",
    "Mayapyap Norte",
    "Mayapyap Sur",
    "Melojavilla",
    "Nabao",
    "Obrero",
    "Padre Burgos",
    "Padre Crisostomo",
    "Pagas",
    "Palagay",
    "Pamaldan",
    "Pangatian",
    "Patalac",
    "Polilio",
    "Pula",
    "Quezon District",
    "Rizdelis",
    "Samon",
    "San Isidro",
    "San Josef Norte",
    "San Josef Sur",
    "San Juan Poblacion",
    "San Roque Norte",
    "San Roque Sur",
    "Sanbermicristi",
    "Sangitan",
    "Sangitan East",
    "Santa Arcadia",
    "Santo Niño",
    "Sapang",
    "Sumacab Este",
    "Sumacab Norte",
    "Sumacab South",
    "Talipapa",
    "Valdefuente",
    "Valle Cruz",
    "Vijandre District",
    "Villa Ofelia-Caridad",
    "Zulueta District",
  ],
  Gapan: [
    "Balante",
    "Bayanihan",
    "Bulak",
    "Bungo",
    "Kapalangan",
    "Mabuga",
    "Makabaclay",
    "Malimba",
    "Mangino",
    "Pambuan",
    "Puting Tubig",
    "San Fernando",
    "San Lorenzo",
    "San Nicolas",
    "San Roque",
    "San Vicente",
    "Santa Cruz",
    "Santa Rita",
    "Santo Cristo Norte",
    "Santo Cristo Sur",
    "Santo Niño",
    "Santo Tomas North",
    "Mahipon",
  ],
  "San Jose, Nueva Ecija": [
    "A. Pascual",
    "Abar 2nd",
    "Abar Ist",
    "Bagong Sikat",
    "Caanawan",
    "Calaocan",
    "Camanacsacan",
    "Canuto Ramos Poblacion",
    "Crisanto Sanchez Poblacion",
    "Culaylay",
    "Dizol",
    "Ferdinand E. Marcos Poblacion",
    "Kaliwanagan",
    "Kita-Kita",
    "Malasin",
    "Manicla",
    "Palestina",
    "Parang Mangga",
    "Pinili",
    "Porais",
    "Rafael Rueda, Sr. Poblacion",
    "Raymundo Eugenio Poblacion",
    "San Agustin",
    "San Juan",
    "San Mauricio",
    "Santo Niño 1st",
    "Santo Niño 2nd",
    "Santo Niño 3rd",
    "Santo Tomas",
    "Sibut",
    "Sinipit Bubon",
    "Tabulac",
    "Tayabo",
    "Tondod",
    "Tulat",
    "Villa Floresca",
    "Villa Joson",
    "Villa Marina",
  ],
  Anao: [
    "Baguindoc, Anao",
    "Bantog, Anao",
    "Campos, Anao",
    "Carmen, Anao",
    "Casili, Anao",
    "Don Ramon, Anao",
    "Hernando, Anao",
    "Poblacion, Anao",
    "Rizal, Anao",
    "San Francisco East, Anao",
    "San Francisco West, Anao",
    "San Jose North, Anao",
    "San Jose South, Anao",
    "San Juan, Anao",
    "San Roque, Anao",
    "Santo Domingo, Anao",
    "Sinense, Anao",
    "Suaverdez, Anao",
  ],
  Bamban: [
    "Anupul, Bamban",
    "Banaba, Bamban",
    "Bangcu, Bamban",
    "Culubasa, Bamban",
    "Dela Cruz, Bamban",
    "La Paz, Bamban",
    "Lourdes, Bamban",
    "Malonzo, Bamban",
    "San Nicolas, Bamban",
    "San Pedro, Bamban",
    "San Rafael, Bamban",
    "San Roque, Bamban",
    "San Vicente, Bamban",
    "Santo Niño, Bamban",
    "Virgen de los Remedios, Bamban",
  ],
  Camiling: [
    "Anoling 1st, Camiling",
    "Anoling 2nd, Camiling",
    "Anoling 3rd, Camiling",
    "Bacabac, Camiling",
    "Bacsay, Camiling",
    "Bancay 1st, Camiling",
    "Bilad, Camiling",
    "Birbira, Camiling",
    "Bobon 1st, Camiling",
    "Bobon 2nd, Camiling",
    "Bobon Caarosipan, Camiling",
    "Cabanabaan, Camiling",
    "Cacamilingan Norte, Camiling",
    "Cacamilingan Sur, Camiling",
    "Caniag, Camiling",
    "Carael, Camiling",
    "Cayaoan, Camiling",
    "Cayasan, Camiling",
    "Florida, Camiling",
    "Lasong, Camiling",
    "Libueg, Camiling",
    "Malacampa, Camiling",
    "Manakem, Camiling",
    "Manupeg, Camiling",
    "Marawi, Camiling",
    "Matubog, Camiling",
    "Nagrambacan, Camiling",
    "Nagserialan, Camiling",
    "Palimbo Proper, Camiling",
    "Palimbo-Caarosipan, Camiling",
    "Pao 1st, Camiling",
    "Pao 2nd, Camiling",
    "Pao 3rd, Camiling",
    "Papaac, Camiling",
    "Pindangan 1st, Camiling",
    "Pindangan 2nd, Camiling",
    "Poblacion A, Camiling",
    "Poblacion B, Camiling",
    "Poblacion C, Camiling",
    "Poblacion D, Camiling",
    "Poblacion E, Camiling",
    "Poblacion F, Camiling",
    "Poblacion G, Camiling",
    "Poblacion H, Camiling",
    "Poblacion I, Camiling",
    "Poblacion J, Camiling",
    "San Isidro, Camiling",
    "Santa Maria, Camiling",
    "Sawat, Camiling",
    "Sinilian 1st, Camiling",
    "Sinilian 2nd, Camiling",
    "Sinilian 3rd, Camiling",
    "Sinilian Cacalibosoan, Camiling",
    "Sinulatan 1st, Camiling",
    "Sinulatan 2nd, Camiling",
    "Surgui 1st, Camiling",
    "Surgui 2nd, Camiling",
    "Surgui 3rd, Camiling",
    "Tambugan, Camiling",
    "Telbang, Camiling",
    "Tuec, Camiling",
  ],
  Capas: [
    "Aranguren, Capas",
    "Bueno, Capas",
    "Cristo Rey, Capas",
    "Cubcub, Capas",
    "Cutcut 1st, Capas",
    "Cutcut 2nd, Capas",
    "Dolores, Capas",
    "Estrada, Capas",
    "Lawy, Capas",
    "Manga, Capas",
    "Manlapig, Capas",
    "Maruglu, Capas",
    "O'Donnell, Capas",
    "Santa Juliana, Capas",
    "Santa Lucia, Capas",
    "Santa Rita, Capas",
    "Santo Domingo 1st, Capas",
    "Santo Domingo 2nd, Capas",
    "Santo Rosario, Capas",
    "Talaga, Capas",
  ],
  Concepcion: [
    "Alfonso, Concepcion",
    "Balutu, Concepcion",
    "Cafe, Concepcion",
    "Calius Gueco, Concepcion",
    "Caluluan, Concepcion",
    "Castillo, Concepcion",
    "Corazon de Jesus, Concepcion",
    "Culatingan, Concepcion",
    "Dungan, Concepcion",
    "Dutung-A-Matas, Concepcion",
    "Green Village, Concepcion",
    "Lilibangan, Concepcion",
    "Mabilog, Concepcion",
    "Magao, Concepcion",
    "Malupa, Concepcion",
    "Minane, Concepcion",
    "Panalicsian, Concepcion",
    "Pando, Concepcion",
    "Parang, Concepcion",
    "Parulung, Concepcion",
    "Pitabunan, Concepcion",
    "San Agustin, Concepcion",
    "San Antonio, Concepcion",
    "San Bartolome, Concepcion",
    "San Francisco, Concepcion",
    "San Isidro, Concepcion",
    "San Jose, Concepcion",
    "San Juan, Concepcion",
    "San Martin, Concepcion",
    "San Nicolas, Concepcion",
    "San Nicolas Balas, Concepcion",
    "San Vicente, Concepcion",
    "Santa Cruz, Concepcion",
    "Santa Maria, Concepcion",
    "Santa Monica, Concepcion",
    "Santa Rita, Concepcion",
    "Santa Rosa, Concepcion",
    "Santiago, Concepcion",
    "Santo Cristo, Concepcion",
    "Santo Niño, Concepcion",
    "Santo Rosario, Concepcion",
    "Talimunduc Marimla, Concepcion",
    "Talimunduc San Miguel, Concepcion",
    "Telabanca, Concepcion",
    "Tinang, Concepcion",
  ],
  Gerona: [
    "Abagon, Gerona",
    "Amacalan, Gerona",
    "Apsayan, Gerona",
    "Ayson, Gerona",
    "Bawa, Gerona",
    "Buenlag, Gerona",
    "Bularit, Gerona",
    "Calayaan, Gerona",
    "Carbonel, Gerona",
    "Cardona, Gerona",
    "Caturay, Gerona",
    "Danzo, Gerona",
    "Dicolor, Gerona",
    "Don Basilio, Gerona",
    "Luna, Gerona",
    "Mabini, Gerona",
    "Magaspac, Gerona",
    "Malayep, Gerona",
    "Matapitap, Gerona",
    "Matayumcab, Gerona",
    "New Salem, Gerona",
    "Oloybuaya, Gerona",
    "Padapada, Gerona",
    "Parsolingan, Gerona",
    "Pinasling, Gerona",
    "Plastado, Gerona",
    "Poblacion 1, Gerona",
    "Poblacion 2, Gerona",
    "Poblacion 3, Gerona",
    "Quezon, Gerona",
    "Rizal, Gerona",
    "Salapungan, Gerona",
    "San Agustin, Gerona",
    "San Antonio, Gerona",
    "San Bartolome, Gerona",
    "San Jose, Gerona",
    "Santa Lucia, Gerona",
    "Santiago, Gerona",
    "Sembrano, Gerona",
    "Singat, Gerona",
    "Sulipa, Gerona",
    "Tagumbao, Gerona",
    "Tangcaran, Gerona",
    "Villa Paz, Gerona",
  ],
  "La Paz": [
    "Balanoy, La Paz",
    "Bantog-Caricutan, La Paz",
    "Caramutan, La Paz",
    "Caut, La Paz",
    "Comillas, La Paz",
    "Dumarais, La Paz",
    "Guevarra, La Paz",
    "Kapanikian, La Paz",
    "La Purisima, La Paz",
    "Lara, La Paz",
    "Laungcupang, La Paz",
    "Lomboy, La Paz",
    "Macalong, La Paz",
    "Matayumtayum, La Paz",
    "Mayang, La Paz",
    "Motrico, La Paz",
    "Paludpud, La Paz",
    "Rizal, La Paz",
    "San Isidro, La Paz",
    "San Roque, La Paz",
    "Sierra, La Paz",
  ],
  Mayantoc: [
    "Ambalingit, Mayantoc",
    "Baybayaoas, Mayantoc",
    "Bigbiga, Mayantoc",
    "Binbinaca, Mayantoc",
    "Calabtangan, Mayantoc",
    "Caocaoayan, Mayantoc",
    "Carabaoan, Mayantoc",
    "Cubcub, Mayantoc",
    "Gayonggayong, Mayantoc",
    "Gossood, Mayantoc",
    "Labney, Mayantoc",
    "Mamonit, Mayantoc",
    "Maniniog, Mayantoc",
    "Mapandan, Mayantoc",
    "Nambalan, Mayantoc",
    "Pedro L. Quines, Mayantoc",
    "Pitombayog, Mayantoc",
    "Poblacion Norte, Mayantoc",
    "Poblacion Sur, Mayantoc",
    "Rotrottooc, Mayantoc",
    "San Bartolome, Mayantoc",
    "San Jose, Mayantoc",
    "Taldiapan, Mayantoc",
    "Tangcarang, Mayantoc",
  ],
  Moncada: [
    "Ablang-Sapang, Moncada",
    "Aringin, Moncada",
    "Atencio, Moncada",
    "Banaoang East, Moncada",
    "Banaoang West, Moncada",
    "Baquero Norte, Moncada",
    "Baquero Sur, Moncada",
    "Burgos, Moncada",
    "Calamay, Moncada",
    "Calapan, Moncada",
    "Camangaan East, Moncada",
    "Camangaan West, Moncada",
    "Camposanto 1-Norte, Moncada",
    "Camposanto 1-Sur, Moncada",
    "Camposanto 2, Moncada",
    "Capaoayan, Moncada",
    "Lapsing, Moncada",
    "Mabini, Moncada",
    "Maluac, Moncada",
    "Poblacion 1, Moncada",
    "Poblacion 2, Moncada",
    "Poblacion 3, Moncada",
    "Poblacion 4, Moncada",
    "Rizal, Moncada",
    "San Juan, Moncada",
    "San Julian, Moncada",
    "San Leon, Moncada",
    "San Pedro, Moncada",
    "San Roque, Moncada",
    "Santa Lucia East, Moncada",
    "Santa Lucia West, Moncada",
    "Santa Maria, Moncada",
    "Santa Monica, Moncada",
    "Tolega Norte, Moncada",
    "Tolega Sur, Moncada",
    "Tubectubang, Moncada",
    "Villa, Moncada",
  ],
  Paniqui: [
    "Abogado, Paniqui",
    "Acocolao, Paniqui",
    "Aduas, Paniqui",
    "Apulid, Paniqui",
    "Balaoang, Paniqui",
    "Barang, Paniqui",
    "Brillante, Paniqui",
    "Burgos, Paniqui",
    "Cabayaoasan, Paniqui",
    "Canan, Paniqui",
    "Carino, Paniqui",
    "Cayanga, Paniqui",
    "Colibangbang, Paniqui",
    "Coral, Paniqui",
    "Dapdap, Paniqui",
    "Estacion, Paniqui",
    "Mabilang, Paniqui",
    "Manaois, Paniqui",
    "Matalapitap, Paniqui",
    "Nagmisaan, Paniqui",
    "Nancamarinan, Paniqui",
    "Nipaco, Paniqui",
    "Patalan, Paniqui",
    "Poblacion Norte, Paniqui",
    "Poblacion Sur, Paniqui",
    "Rang-ayan, Paniqui",
    "Salumague, Paniqui",
    "Samput, Paniqui",
    "San Carlos, Paniqui",
    "San Isidro, Paniqui",
    "San Juan de Milla, Paniqui",
    "Santa Ines, Paniqui",
    "Sinigpit, Paniqui",
    "Tablang, Paniqui",
    "Ventenilla, Paniqui",
  ],
  Pura: [
    "Balite, Pura",
    "Buenavista, Pura",
    "Cadanglaan, Pura",
    "Estipona, Pura",
    "Linao, Pura",
    "Maasin, Pura",
    "Matindeg, Pura",
    "Maungib, Pura",
    "Naya, Pura",
    "Nilasin 1st, Pura",
    "Nilasin 2nd, Pura",
    "Poblacion 1, Pura",
    "Poblacion 2, Pura",
    "Poblacion 3, Pura",
    "Poroc, Pura",
    "Singat, Pura",
  ],
  Ramos: [
    "Coral-Iloco, Ramos",
    "Guiteb, Ramos",
    "Pance, Ramos",
    "Poblacion Center, Ramos",
    "Poblacion North, Ramos",
    "Poblacion South, Ramos",
    "San Juan, Ramos",
    "San Raymundo, Ramos",
    "Toledo, Ramos",
  ],
  "San Clemente": [
    "Balloc, San Clemente",
    "Bamban, San Clemente",
    "Casipo, San Clemente",
    "Catagudingan, San Clemente",
    "Daldalayap, San Clemente",
    "Doclong 1, San Clemente",
    "Doclong 2, San Clemente",
    "Maasin, San Clemente",
    "Nagsabaran, San Clemente",
    "Pit-ao, San Clemente",
    "Poblacion Norte, San Clemente",
    "Poblacion Sur, San Clemente",
  ],
  "San Jose, Tarlac": [
    "Burgos, San Jose",
    "David, San Jose",
    "Iba, San Jose",
    "Labney, San Jose",
    "Lawacamulag, San Jose",
    "Lubigan, San Jose",
    "Maamot, San Jose",
    "Mababanaba, San Jose",
    "Moriones, San Jose",
    "Pao, San Jose",
    "San Juan de Valdez, San Jose",
    "Sula, San Jose",
    "Villa Aglipay, San Jose",
  ],
  "San Manuel": [
    "Colubot, San Manuel",
    "Lanat, San Manuel",
    "Legaspi, San Manuel",
    "Mangandingay, San Manuel",
    "Matarannoc, San Manuel",
    "Pacpaco, San Manuel",
    "Poblacion, San Manuel",
    "Salcedo, San Manuel",
    "San Agustin, San Manuel",
    "San Felipe, San Manuel",
    "San Jacinto, San Manuel",
    "San Miguel, San Manuel",
    "San Narciso, San Manuel",
    "San Vicente, San Manuel",
    "Santa Maria, San Manuel",
  ],
  "Santa Ignacia": [
    "Baldios, Santa Ignacia",
    "Botbotones, Santa Ignacia",
    "Caanamongan, Santa Ignacia",
    "Cabaruan, Santa Ignacia",
    "Cabugbugan, Santa Ignacia",
    "Caduldulaoan, Santa Ignacia",
    "Calipayan, Santa Ignacia",
    "Macaguing, Santa Ignacia",
    "Nambalan, Santa Ignacia",
    "Padapada, Santa Ignacia",
    "Pilpila, Santa Ignacia",
    "Pinpinas, Santa Ignacia",
    "Poblacion East, Santa Ignacia",
    "Poblacion West, Santa Ignacia",
    "Pugo-Cecilio, Santa Ignacia",
    "San Francisco, Santa Ignacia",
    "San Sotero, Santa Ignacia",
    "San Vicente, Santa Ignacia",
    "Santa Ines Centro, Santa Ignacia",
    "Santa Ines East, Santa Ignacia",
    "Santa Ines West, Santa Ignacia",
    "Taguiporo, Santa Ignacia",
    "Timmaguab, Santa Ignacia",
    "Vargas, Santa Ignacia",
  ],
  "Tarlac City": [
    "Aguso, Tarlac City",
    "Alvindia Segundo, Tarlac City",
    "Amucao, Tarlac City",
    "Armenia, Tarlac City",
    "Asturias, Tarlac City",
    "Atioc, Tarlac City",
    "Balanti, Tarlac City",
    "Balete, Tarlac City",
    "Balibago I, Tarlac City",
    "Balibago II, Tarlac City",
    "Balingcanaway, Tarlac City",
    "Banaba, Tarlac City",
    "Bantog, Tarlac City",
    "Baras-baras, Tarlac City",
    "Batang-batang, Tarlac City",
    "Binauganan, Tarlac City",
    "Bora, Tarlac City",
    "Buenavista, Tarlac City",
    "Buhilit, Tarlac City",
    "Burot, Tarlac City",
    "Calingcuan, Tarlac City",
    "Capehan, Tarlac City",
    "Carangian, Tarlac City",
    "Care, Tarlac City",
    "Central, Tarlac City",
    "Culipat, Tarlac City",
    "Cut-cut I, Tarlac City",
    "Cut-cut II, Tarlac City",
    "Dalayap, Tarlac City",
    "Dela Paz, Tarlac City",
    "Dolores, Tarlac City",
    "Laoang, Tarlac City",
    "Ligtasan, Tarlac City",
    "Lourdes, Tarlac City",
    "Mabini, Tarlac City",
    "Maligaya, Tarlac City",
    "Maliwalo, Tarlac City",
    "Mapalacsiao, Tarlac City",
    "Mapalad, Tarlac City",
    "Matadero, Tarlac City",
    "Matatalaib, Tarlac City",
    "Paraiso, Tarlac City",
    "Poblacion, Tarlac City",
    "Salapungan, Tarlac City",
    "San Carlos, Tarlac City",
    "San Francisco, Tarlac City",
    "San Isidro, Tarlac City",
    "San Jose, Tarlac City",
    "San Jose de Urquico, Tarlac City",
    "San Juan de Mata, Tarlac City",
    "San Luis, Tarlac City",
    "San Manuel, Tarlac City",
    "San Miguel, Tarlac City",
    "San Nicolas, Tarlac City",
    "San Pablo, Tarlac City",
    "San Pascual, Tarlac City",
    "San Rafael, Tarlac City",
    "San Roque, Tarlac City",
    "San Sebastian, Tarlac City",
    "San Vicente, Tarlac City",
    "Santa Cruz, Tarlac City",
    "Santa Maria, Tarlac City",
    "Santo Cristo, Tarlac City",
    "Santo Domingo, Tarlac City",
    "Santo Niño, Tarlac City",
    "Sapang Maragul, Tarlac City",
    "Sapang Tagalog, Tarlac City",
    "Sepung Calzada, Tarlac City",
    "Sinait, Tarlac City",
    "Suizo, Tarlac City",
    "Tariji, Tarlac City",
    "Tibag, Tarlac City",
    "Tibagan, Tarlac City",
    "Trinidad, Tarlac City",
    "Ungot, Tarlac City",
    "Villa Bacolor, Tarlac City",
  ],
  Victoria: [
    "Baculong, Victoria",
    "Balayang, Victoria",
    "Balbaloto, Victoria",
    "Bangar, Victoria",
    "Bantog, Victoria",
    "Batangbatang, Victoria",
    "Bulo, Victoria",
    "Cabuluan, Victoria",
    "Calibungan, Victoria",
    "Canarem, Victoria",
    "Cruz, Victoria",
    "Lalapac, Victoria",
    "Maluid, Victoria",
    "Mangolago, Victoria",
    "Masalasa, Victoria",
    "Palacpalac, Victoria",
    "San Agustin, Victoria",
    "San Andres, Victoria",
    "San Fernando, Victoria",
    "San Francisco, Victoria",
    "San Gavino, Victoria",
    "San Jacinto, Victoria",
    "San Nicolas, Victoria",
    "San Vicente, Victoria",
    "Santa Barbara, Victoria",
    "Santa Lucia, Victoria",
  ],
  Angat: [
    "Banaban, Angat",
    "Baybay, Angat",
    "Binagbag, Angat",
    "Donacion, Angat",
    "Encanto, Angat",
    "Laog, Angat",
    "Marungko, Angat",
    "Niugan, Angat",
    "Paltok, Angat",
    "Pulong Yantok, Angat",
    "San Roque, Angat",
    "Santa Cruz, Angat",
    "Santa Lucia, Angat",
    "Santo Cristo, Angat",
    "Sulucan, Angat",
    "Taboc, Angat",
  ],
  Balagtas: [
    "Borol 1st, Balagtas",
    "Borol 2nd, Balagtas",
    "Dalig, Balagtas",
    "Longos, Balagtas",
    "Panginay, Balagtas",
    "Pulong Gubat, Balagtas",
    "San Juan, Balagtas",
    "Santol, Balagtas",
    "Wawa, Balagtas",
  ],
  Baliuag: [
    "Bagong Nayon, Baliuag",
    "Barangca, Baliuag",
    "Calantipay, Baliuag",
    "Catulinan, Baliuag",
    "Concepcion, Baliuag",
    "Hinukay, Baliuag",
    "Makinabang, Baliuag",
    "Matangtubig, Baliuag",
    "Pagala, Baliuag",
    "Paitan, Baliuag",
    "Piel, Baliuag",
    "Pinagbarilan, Baliuag",
    "Poblacion, Baliuag",
    "Sabang, Baliuag",
    "San Jose, Baliuag",
    "San Roque, Baliuag",
    "Santa Barbara, Baliuag",
    "Santo Cristo, Baliuag",
    "Santo Niño, Baliuag",
    "Subic, Baliuag",
    "Sulivan, Baliuag",
    "Tangos, Baliuag",
    "Tarcan, Baliuag",
    "Tiaong, Baliuag",
    "Tibag, Baliuag",
    "Tilapayong, Baliuag",
    "Virgen delas Flores, Baliuag",
  ],
  Bocaue: [
    "Antipona, Bocaue",
    "Bagumbayan, Bocaue",
    "Bambang, Bocaue",
    "Batia, Bocaue",
    "Biñang 1st, Bocaue",
    "Biñang 2nd, Bocaue",
    "Bolacan, Bocaue",
    "Bundukan, Bocaue",
    "Bunlo, Bocaue",
    "Caingin, Bocaue",
    "Duhat, Bocaue",
    "Igulot, Bocaue",
    "Lolomboy, Bocaue",
    "Poblacion, Bocaue",
    "Sulucan, Bocaue",
    "Taal, Bocaue",
    "Tambobong, Bocaue",
    "Turo, Bocaue",
    "Wakas, Bocaue",
  ],
  Bulakan: [
    "Bagumbayan, Bulakan",
    "Balubad, Bulakan",
    "Bambang, Bulakan",
    "Matungao, Bulakan",
    "Maysantol, Bulakan",
    "Perez, Bulakan",
    "Pitpitan, Bulakan",
    "San Francisco, Bulakan",
    "San Jose, Bulakan",
    "San Nicolas, Bulakan",
    "Santa Ana, Bulakan",
    "Santa Ines, Bulakan",
    "Taliptip, Bulakan",
    "Tibig, Bulakan",
  ],
  Bustos: [
    "Bonga Mayor, Bustos",
    "Bonga Menor, Bustos",
    "Buisan, Bustos",
    "Camachilihan, Bustos",
    "Cambaog, Bustos",
    "Catacte, Bustos",
    "Liciada, Bustos",
    "Malamig, Bustos",
    "Malawak, Bustos",
    "Poblacion, Bustos",
    "San Pedro, Bustos",
    "Talampas, Bustos",
    "Tanawan, Bustos",
    "Tibagan, Bustos",
  ],
  Calumpit: [
    "Balite, Calumpit",
    "Balungao, Calumpit",
    "Buguion, Calumpit",
    "Bulusan, Calumpit",
    "Calizon, Calumpit",
    "Calumpang, Calumpit",
    "Caniogan, Calumpit",
    "Corazon, Calumpit",
    "Frances, Calumpit",
    "Gatbuca, Calumpit",
    "Gugo, Calumpit",
    "Iba Este, Calumpit",
    "Iba O'Este, Calumpit",
    "Longos, Calumpit",
    "Meysulao, Calumpit",
    "Meyto, Calumpit",
    "Palimbang, Calumpit",
    "Panducot, Calumpit",
    "Pio Cruzcosa, Calumpit",
    "Poblacion, Calumpit",
    "Pungo, Calumpit",
    "San Jose, Calumpit",
    "San Marcos, Calumpit",
    "San Miguel, Calumpit",
    "Santa Lucia, Calumpit",
    "Santo Niño, Calumpit",
    "Sapang Bayan, Calumpit",
    "Sergio Bayan, Calumpit",
    "Sucol, Calumpit",
  ],
  "Doña Remedios Trinidad": [
    "Bayabas, Doña Remedios Trinidad",
    "Camachile, Doña Remedios Trinidad",
    "Camachin, Doña Remedios Trinidad",
    "Kabayunan, Doña Remedios Trinidad",
    "Kalawakan, Doña Remedios Trinidad",
    "Pulong Sampalok, Doña Remedios Trinidad",
    "Sapang Bulak, Doña Remedios Trinidad",
    "Talbak, Doña Remedios Trinidad",
  ],
  Guiguinto: [
    "Cutcut, Guiguinto",
    "Daungan, Guiguinto",
    "Ilang-Ilang, Guiguinto",
    "Malis, Guiguinto",
    "Panginay, Guiguinto",
    "Poblacion, Guiguinto",
    "Pritil, Guiguinto",
    "Pulong Gubat, Guiguinto",
    "Santa Cruz, Guiguinto",
    "Santa Rita, Guiguinto",
    "Tabang, Guiguinto",
    "Tabe, Guiguinto",
    "Tiaong, Guiguinto",
    "Tuktukan, Guiguinto",
  ],
  Hagonoy: [
    "Abulalas, Hagonoy",
    "Carillo, Hagonoy",
    "Iba, Hagonoy",
    "Iba-Ibayo, Hagonoy",
    "Mercado, Hagonoy",
    "Palapat, Hagonoy",
    "Pugad, Hagonoy",
    "Sagrada Familia, Hagonoy",
    "San Agustin, Hagonoy",
    "San Isidro, Hagonoy",
    "San Jose, Hagonoy",
    "San Juan, Hagonoy",
    "San Miguel, Hagonoy",
    "San Nicolas, Hagonoy",
    "San Pablo, Hagonoy",
    "San Pascual, Hagonoy",
    "San Pedro, Hagonoy",
    "San Roque, Hagonoy",
    "San Sebastian, Hagonoy",
    "Santa Cruz, Hagonoy",
    "Santa Elena, Hagonoy",
    "Santa Monica, Hagonoy",
    "Santo Niño, Hagonoy",
    "Santo Rosario, Hagonoy",
    "Tampok, Hagonoy",
    "Tibaguin, Hagonoy",
  ],
  Malolos: [
    "Anilao, Malolos",
    "Atlag, Malolos",
    "Babatnin, Malolos",
    "Bagna, Malolos",
    "Bagong Bayan, Malolos",
    "Balayong, Malolos",
    "Balite, Malolos",
    "Bangkal, Malolos",
    "Barihan, Malolos",
    "Bulihan, Malolos",
    "Bungahan, Malolos",
    "Caingin, Malolos",
    "Calero, Malolos",
    "Caliligawan, Malolos",
    "Canalate, Malolos",
    "Caniogan, Malolos",
    "Catmon, Malolos",
    "Cofradia, Malolos",
    "Dakila, Malolos",
    "Guinhawa, Malolos",
    "Ligas, Malolos",
    "Liyang, Malolos",
    "Longos, Malolos",
    "Look 1st, Malolos",
    "Look 2nd, Malolos",
    "Lugam, Malolos",
    "Mabolo, Malolos",
    "Mambog, Malolos",
    "Masile, Malolos",
    "Matimbo, Malolos",
    "Mojon, Malolos",
    "Namayan, Malolos",
    "Niugan, Malolos",
    "Pamarawan, Malolos",
    "Panasahan, Malolos",
    "Pinagbakahan, Malolos",
    "San Agustin, Malolos",
    "San Gabriel, Malolos",
    "San Juan, Malolos",
    "San Pablo, Malolos",
    "San Vicente, Malolos",
    "Santiago, Malolos",
    "Santisima Trinidad, Malolos",
    "Santo Cristo, Malolos",
    "Santo Niño, Malolos",
    "Santo Rosario, Malolos",
    "Santol, Malolos",
    "Sumapang Bata, Malolos",
    "Sumapang Matanda, Malolos",
    "Taal, Malolos",
    "Tikay, Malolos",
  ],
  Marilao: [
    "Abangan Norte, Marilao",
    "Abangan Sur, Marilao",
    "Ibayo, Marilao",
    "Lambakin, Marilao",
    "Lias, Marilao",
    "Loma de Gato, Marilao",
    "Nagbalon, Marilao",
    "Patubig, Marilao",
    "Poblacion I, Marilao",
    "Poblacion II, Marilao",
    "Prenza I, Marilao",
    "Prenza II, Marilao",
    "Santa Rosa I, Marilao",
    "Santa Rosa II, Marilao",
    "Saog, Marilao",
    "Tabing Ilog, Marilao",
  ],
  Meycuayan: [
    "Bagbaguin, Meycauayan",
    "Bahay Pare, Meycauayan",
    "Bancal, Meycauayan",
    "Banga, Meycauayan",
    "Bayugo, Meycauayan",
    "Caingin, Meycauayan",
    "Calvario, Meycauayan",
    "Camalig, Meycauayan",
    "Hulo, Meycauayan",
    "Iba, Meycauayan",
    "Langka, Meycauayan",
    "Lawa, Meycauayan",
    "Libtong, Meycauayan",
    "Liputan, Meycauayan",
    "Longos, Meycauayan",
    "Malhacan, Meycauayan",
    "Pajo, Meycauayan",
    "Pandayan, Meycauayan",
    "Pantoc, Meycauayan",
    "Perez, Meycauayan",
    "Poblacion, Meycauayan",
    "Saint Francis, Meycauayan",
    "Saluysoy, Meycauayan",
    "Tugatog, Meycauayan",
    "Ubihan, Meycauayan",
    "Zamora, Meycauayan",
  ],
  Norzagaray: [
    "Bangkal, Norzagaray",
    "Baraka, Norzagaray",
    "Bigte, Norzagaray",
    "Bitungol, Norzagaray",
    "Friendship Village Resources, Norzagaray",
    "Matictic, Norzagaray",
    "Minuyan, Norzagaray",
    "Partida, Norzagaray",
    "Pinagtulayan, Norzagaray",
    "Poblacion, Norzagaray",
    "San Lorenzo, Norzagaray",
    "San Mateo, Norzagaray",
    "Tigbe, Norzagaray",
  ],
  Obando: [
    "Binuangan, Obando",
    "Catanghalan, Obando",
    "Hulo, Obando",
    "Lawa, Obando",
    "Paco, Obando",
    "Pag-asa, Obando",
    "Paliwas, Obando",
    "Panghulo, Obando",
    "Salambao, Obando",
    "San Pascual, Obando",
    "Tawiran, Obando",
  ],
  Pandi: [
    "Bagbaguin, Pandi",
    "Bagong Barrio, Pandi",
    "Baka-bakahan, Pandi",
    "Bunsuran I, Pandi",
    "Bunsuran II, Pandi",
    "Bunsuran III, Pandi",
    "Cacarong Bata, Pandi",
    "Cacarong Matanda, Pandi",
    "Cupang, Pandi",
    "Malibong Bata, Pandi",
    "Malibong Matanda, Pandi",
    "Manatal, Pandi",
    "Mapulang Lupa, Pandi",
    "Masagana, Pandi",
    "Masuso, Pandi",
    "Pinagkuartelan, Pandi",
    "Poblacion, Pandi",
    "Real de Cacarong, Pandi",
    "San Roque, Pandi",
    "Santo Niño, Pandi",
    "Siling Bata, Pandi",
    "Siling Matanda, Pandi",
  ],
  Paombong: [
    "Binakod, Paombong",
    "Kapitangan, Paombong",
    "Malumot, Paombong",
    "Masukol, Paombong",
    "Pinalagdan, Paombong",
    "Poblacion, Paombong",
    "San Isidro I, Paombong",
    "San Isidro II, Paombong",
    "San Jose, Paombong",
    "San Roque, Paombong",
    "San Vicente, Paombong",
    "Santa Cruz, Paombong",
    "Santo Niño, Paombong",
    "Santo Rosario, Paombong",
  ],
  Plaridel: [
    "Agnaya, Plaridel",
    "Bagong Silang, Plaridel",
    "Banga I, Plaridel",
    "Banga II, Plaridel",
    "Bintog, Plaridel",
    "Bulihan, Plaridel",
    "Culianin, Plaridel",
    "Dampol, Plaridel",
    "Lagundi, Plaridel",
    "Lalangan, Plaridel",
    "Lumang Bayan, Plaridel",
    "Parulan, Plaridel",
    "Poblacion, Plaridel",
    "Rueda, Plaridel",
    "San Jose, Plaridel",
    "Santa Ines, Plaridel",
    "Santo Niño, Plaridel",
    "Sipat, Plaridel",
    "Tabang, Plaridel",
  ],
  Pulilan: [
    "Balatong A, Pulilan",
    "Balatong B, Pulilan",
    "Cutcot, Pulilan",
    "Dampol I, Pulilan",
    "Dampol II-A, Pulilan",
    "Dampol II-B, Pulilan",
    "Dulong Malabon, Pulilan",
    "Inaon, Pulilan",
    "Longos, Pulilan",
    "Lumbac, Pulilan",
    "Paltao, Pulilan",
    "Penabatan, Pulilan",
    "Poblacion, Pulilan",
    "Santa Peregrina, Pulilan",
    "Santo Cristo, Pulilan",
    "Taal, Pulilan",
    "Tabon, Pulilan",
    "Tibag, Pulilan",
    "Tinejero, Pulilan",
  ],
  "San Ildefonso": [
    "Akle, San Ildefonso",
    "Alagao, San Ildefonso",
    "Anyatam, San Ildefonso",
    "Bagong Barrio, San Ildefonso",
    "Basuit, San Ildefonso",
    "Bubulong Malaki, San Ildefonso",
    "Bubulong Munti, San Ildefonso",
    "Buhol na Mangga, San Ildefonso",
    "Bulusukan, San Ildefonso",
    "Calasag, San Ildefonso",
    "Calawitan, San Ildefonso",
    "Casalat, San Ildefonso",
    "Gabihan, San Ildefonso",
    "Garlang, San Ildefonso",
    "Lapnit, San Ildefonso",
    "Maasim, San Ildefonso",
    "Makapilapil, San Ildefonso",
    "Malipampang, San Ildefonso",
    "Mataas na Parang, San Ildefonso",
    "Matimbubong, San Ildefonso",
    "Nabaong Garlang, San Ildefonso",
    "Palapala, San Ildefonso",
    "Pasong Bangkal, San Ildefonso",
    "Pinaod, San Ildefonso",
    "Poblacion, San Ildefonso",
    "Pulong Tamo, San Ildefonso",
    "San Juan, San Ildefonso",
    "Santa Catalina Bata, San Ildefonso",
    "Santa Catalina Matanda, San Ildefonso",
    "Sapang Dayap, San Ildefonso",
    "Sapang Putik, San Ildefonso",
    "Sapang Putol, San Ildefonso",
    "Sumandig, San Ildefonso",
    "Telepatio, San Ildefonso",
    "Umpucan, San Ildefonso",
    "Upig, San Ildefonso",
  ],
  "San Jose del Monte": [
    "Assumption, San Jose del Monte",
    "Bagong Buhay, San Jose del Monte",
    "Bagong Buhay II, San Jose del Monte",
    "Bagong Buhay III, San Jose del Monte",
    "Citrus, San Jose del Monte",
    "Ciudad Real, San Jose del Monte",
    "Dulong Bayan, San Jose del Monte",
    "Fatima, San Jose del Monte",
    "Fatima II, San Jose del Monte",
    "Fatima III, San Jose del Monte",
    "Fatima IV, San Jose del Monte",
    "Fatima V, San Jose del Monte",
    "Francisco Homes-Guijo, San Jose del Monte",
    "Francisco Homes-Mulawin, San Jose del Monte",
    "Francisco Homes-Narra, San Jose del Monte",
    "Francisco Homes-Yakal, San Jose del Monte",
    "Gaya-gaya, San Jose del Monte",
    "Graceville, San Jose del Monte",
    "Gumaoc Central, San Jose del Monte",
    "Gumaoc East, San Jose del Monte",
    "Gumaoc West, San Jose del Monte",
    "Kaybanban, San Jose del Monte",
    "Kaypian, San Jose del Monte",
    "Lawang Pari, San Jose del Monte",
    "Maharlika, San Jose del Monte",
    "Minuyan, San Jose del Monte",
    "Minuyan II, San Jose del Monte",
    "Minuyan III, San Jose del Monte",
    "Minuyan IV, San Jose del Monte",
    "Minuyan Proper, San Jose del Monte",
    "Minuyan V, San Jose del Monte",
    "Muzon, San Jose del Monte",
    "Paradise III, San Jose del Monte",
    "Poblacion, San Jose del Monte",
    "Poblacion I, San Jose del Monte",
    "Saint Martin de Porres, San Jose del Monte",
    "San Isidro, San Jose del Monte",
    "San Manuel, San Jose del Monte",
    "San Martin, San Jose del Monte",
    "San Martin II, San Jose del Monte",
    "San Martin III, San Jose del Monte",
    "San Martin IV, San Jose del Monte",
    "San Pedro, San Jose del Monte",
    "San Rafael, San Jose del Monte",
    "San Rafael I, San Jose del Monte",
    "San Rafael III, San Jose del Monte",
    "San Rafael IV, San Jose del Monte",
    "San Rafael V, San Jose del Monte",
    "San Roque, San Jose del Monte",
    "Santa Cruz, San Jose del Monte",
    "Santa Cruz II, San Jose del Monte",
    "Santa Cruz III, San Jose del Monte",
    "Santa Cruz IV, San Jose del Monte",
    "Santa Cruz V, San Jose del Monte",
    "Santo Cristo, San Jose del Monte",
    "Santo Niño, San Jose del Monte",
    "Santo Niño II, San Jose del Monte",
    "Sapang Palay, San Jose del Monte",
    "Tungkong Mangga, San Jose del Monte",
  ],
  "San Miguel, Bulacan": [
    "Bagong Pag-asa, San Miguel",
    "Bagong Silang, San Miguel",
    "Balaong, San Miguel",
    "Balite, San Miguel",
    "Bantog, San Miguel",
    "Bardias, San Miguel",
    "Baritan, San Miguel",
    "Batasan Bata, San Miguel",
    "Batasan Matanda, San Miguel",
    "Biak-na-Bato, San Miguel",
    "Biclat, San Miguel",
    "Buga, San Miguel",
    "Buliran, San Miguel",
    "Bulualto, San Miguel",
    "Calumpang, San Miguel",
    "Cambio, San Miguel",
    "Camias, San Miguel",
    "Ilog-Bulo, San Miguel",
    "King Kabayo, San Miguel",
    "Labne, San Miguel",
    "Lambakin, San Miguel",
    "Magmarale, San Miguel",
    "Malibay, San Miguel",
    "Maligaya, San Miguel",
    "Mandile, San Miguel",
    "Masalipit, San Miguel",
    "Pacalag, San Miguel",
    "Paliwasan, San Miguel",
    "Partida, San Miguel",
    "Pinambaran, San Miguel",
    "Poblacion, San Miguel",
    "Pulong Bayabas, San Miguel",
    "Pulong Duhat, San Miguel",
    "Sacdalan, San Miguel",
    "Salacot, San Miguel",
    "Salangan, San Miguel",
    "San Agustin, San Miguel",
    "San Jose, San Miguel",
    "San Juan, San Miguel",
    "San Vicente, San Miguel",
    "Santa Ines, San Miguel",
    "Santa Lucia, San Miguel",
    "Santa Rita Bata, San Miguel",
    "Santa Rita Matanda, San Miguel",
    "Sapang, San Miguel",
    "Sibul, San Miguel",
    "Tartaro, San Miguel",
    "Tibagan, San Miguel",
    "Tigpalas, San Miguel",
  ],
  "San Rafael": [
    "BMA-Balagtas, San Rafael",
    "Banca-banca, San Rafael",
    "Caingin, San Rafael",
    "Capihan, San Rafael",
    "Coral na Bato, San Rafael",
    "Cruz na Daan, San Rafael",
    "Dagat-dagatan, San Rafael",
    "Diliman I, San Rafael",
    "Diliman II, San Rafael",
    "Libis, San Rafael",
    "Lico, San Rafael",
    "Maasim, San Rafael",
    "Mabalas-balas, San Rafael",
    "Maguinao, San Rafael",
    "Maronguillo, San Rafael",
    "Paco, San Rafael",
    "Pansumaloc, San Rafael",
    "Pantubig, San Rafael",
    "Pasong Bangkal, San Rafael",
    "Pasong Callos, San Rafael",
    "Pasong Intsik, San Rafael",
    "Pinacpinacan, San Rafael",
    "Poblacion, San Rafael",
    "Pulo, San Rafael",
    "Pulong Bayabas, San Rafael",
    "Salapungan, San Rafael",
    "Sampaloc, San Rafael",
    "San Agustin, San Rafael",
    "San Roque, San Rafael",
    "Sapang Pahalang, San Rafael",
    "Talacsan, San Rafael",
    "Tambubong, San Rafael",
    "Tukod, San Rafael",
    "Ulingao, San Rafael",
  ],
  "Santa Maria": [
    "Bagbaguin, Santa Maria",
    "Balasing, Santa Maria",
    "Buenavista, Santa Maria",
    "Bulac, Santa Maria",
    "Camangyanan, Santa Maria",
    "Catmon, Santa Maria",
    "Cay Pombo, Santa Maria",
    "Caysio, Santa Maria",
    "Guyong, Santa Maria",
    "Lalakhan, Santa Maria",
    "Mag-asawang Sapa, Santa Maria",
    "Mahabang Parang, Santa Maria",
    "Manggahan, Santa Maria",
    "Parada, Santa Maria",
    "Poblacion, Santa Maria",
    "Pulong Buhangin, Santa Maria",
    "San Gabriel, Santa Maria",
    "San Jose Patag, Santa Maria",
    "San Vicente, Santa Maria",
    "Santa Clara, Santa Maria",
    "Santa Cruz, Santa Maria",
    "Silangan, Santa Maria",
    "Tabing Bakod, Santa Maria",
    "Tumana, Santa Maria",
  ],
  Apalit: [
    "Balucuc, Apalit",
    "Calantipe, Apalit",
    "Cansinala, Apalit",
    "Capalangan, Apalit",
    "Colgante, Apalit",
    "Paligui, Apalit",
    "Sampaloc, Apalit",
    "San Juan, Apalit",
    "San Vicente, Apalit",
    "Sucad, Apalit",
    "Sulipan, Apalit",
    "Tabuyuc, Apalit",
  ],
  Arayat: [
    "Arenas, Arayat",
    "Baliti, Arayat",
    "Batasan, Arayat",
    "Buensuceso, Arayat",
    "Candating, Arayat",
    "Cupang, Arayat",
    "Gatiawin, Arayat",
    "Guemasan, Arayat",
    "Kaledian, Arayat",
    "La Paz, Arayat",
    "Lacmit, Arayat",
    "Lacquios, Arayat",
    "Mangga-Cacutud, Arayat",
    "Mapalad, Arayat",
    "Matamo, Arayat",
    "Panlinlang, Arayat",
    "Paralaya, Arayat",
    "Plazang Luma, Arayat",
    "Poblacion, Arayat",
    "San Agustin Norte, Arayat",
    "San Agustin Sur, Arayat",
    "San Antonio, Arayat",
    "San Jose Mesulo, Arayat",
    "San Juan Bano, Arayat",
    "San Mateo, Arayat",
    "San Nicolas, Arayat",
    "San Roque Bitas, Arayat",
    "Santo Niño Tabuan, Arayat",
    "Suclayin, Arayat",
    "Telapayong, Arayat",
  ],
  Bacolor: [
    "Balas, Bacolor",
    "Cabalantian, Bacolor",
    "Cabambangan, Bacolor",
    "Cabetican, Bacolor",
    "Calibutbut, Bacolor",
    "Concepcion, Bacolor",
    "Dolores, Bacolor",
    "Duat, Bacolor",
    "Macabacle, Bacolor",
    "Magliman, Bacolor",
    "Maliwalu, Bacolor",
    "Mesalipit, Bacolor",
    "Parulog, Bacolor",
    "Potrero, Bacolor",
    "San Antonio, Bacolor",
    "San Isidro, Bacolor",
    "San Vicente, Bacolor",
    "Santa Barbara, Bacolor",
    "Santa Ines, Bacolor",
    "Talba, Bacolor",
    "Tinajero, Bacolor",
  ],
  Candaba: [
    "Bahay Pare, Candaba",
    "Bambang, Candaba",
    "Barangca, Candaba",
    "Barit, Candaba",
    "Buas, Candaba",
    "Cuayang Bugtong, Candaba",
    "Dalayap, Candaba",
    "Dulong Ilog, Candaba",
    "Gulap, Candaba",
    "Lanang, Candaba",
    "Lourdes, Candaba",
    "Magumbali, Candaba",
    "Mandasig, Candaba",
    "Mandili, Candaba",
    "Mangga, Candaba",
    "Mapaniqui, Candaba",
    "Paligui, Candaba",
    "Pangclara, Candaba",
    "Pansinao, Candaba",
    "Paralaya, Candaba",
    "Pasig, Candaba",
    "Pescadores, Candaba",
    "Pulong Gubat, Candaba",
    "Pulong Palazan, Candaba",
    "Salapungan, Candaba",
    "San Agustin, Candaba",
    "Santo Rosario, Candaba",
    "Tagulod, Candaba",
    "Talang, Candaba",
    "Tenejero, Candaba",
    "Vizal San Pablo, Candaba",
    "Vizal Santo Cristo, Candaba",
    "Vizal Santo Niño, Candaba",
  ],
  Floridablanca: [
    "Anon, Floridablanca",
    "Apalit, Floridablanca",
    "Basa Air Base, Floridablanca",
    "Benedicto, Floridablanca",
    "Bodega, Floridablanca",
    "Cabangcalan, Floridablanca",
    "Calantas, Floridablanca",
    "Carmencita, Floridablanca",
    "Consuelo, Floridablanca",
    "Dampe, Floridablanca",
    "Del Carmen, Floridablanca",
    "Fortuna, Floridablanca",
    "Gutad, Floridablanca",
    "Mabical, Floridablanca",
    "Maligaya, Floridablanca",
    "Mawacat, Floridablanca",
    "Nabuclod, Floridablanca",
    "Pabanlag, Floridablanca",
    "Paguiruan, Floridablanca",
    "Palmayo, Floridablanca",
    "Pandaguirig, Floridablanca",
    "Poblacion, Floridablanca",
    "San Antonio, Floridablanca",
    "San Isidro, Floridablanca",
    "San Jose, Floridablanca",
    "San Nicolas, Floridablanca",
    "San Pedro, Floridablanca",
    "San Ramon, Floridablanca",
    "San Roque, Floridablanca",
    "Santa Monica, Floridablanca",
    "Santo Rosario, Floridablanca",
    "Solib, Floridablanca",
    "Valdez, Floridablanca",
  ],
  Guagua: [
    "Ascomo, Guagua",
    "Bancal, Guagua",
    "Jose Abad Santos, Guagua",
    "Lambac, Guagua",
    "Magsaysay, Guagua",
    "Maquiapo, Guagua",
    "Natividad, Guagua",
    "Plaza Burgos, Guagua",
    "Pulungmasle, Guagua",
    "Rizal, Guagua",
    "San Agustin, Guagua",
    "San Antonio, Guagua",
    "San Isidro, Guagua",
    "San Jose, Guagua",
    "San Juan, Guagua",
    "San Juan Bautista, Guagua",
    "San Juan Nepomuceno, Guagua",
    "San Matias, Guagua",
    "San Miguel, Guagua",
    "San Nicolas 1st, Guagua",
    "San Nicolas 2nd, Guagua",
    "San Pablo, Guagua",
    "San Pedro, Guagua",
    "San Rafael, Guagua",
    "San Roque, Guagua",
    "San Vicente, Guagua",
    "Santa Filomena, Guagua",
    "Santa Ines, Guagua",
    "Santa Ursula, Guagua",
    "Santo Cristo, Guagua",
    "Santo Niño, Guagua",
  ],
  Lubao: [
    "Balantacan, Lubao",
    "Bancal Pugad, Lubao",
    "Bancal Sinubli, Lubao",
    "Baruya, Lubao",
    "Calangain, Lubao",
    "Concepcion, Lubao",
    "De La Paz, Lubao",
    "Del Carmen, Lubao",
    "Don Ignacio Dimson, Lubao",
    "Lourdes, Lubao",
    "Prado Siongco, Lubao",
    "Remedios, Lubao",
    "San Agustin, Lubao",
    "San Antonio, Lubao",
    "San Francisco, Lubao",
    "San Isidro, Lubao",
    "San Jose Apunan, Lubao",
    "San Jose Gumi, Lubao",
    "San Juan, Lubao",
    "San Matias, Lubao",
    "San Miguel, Lubao",
    "San Nicolas 1st, Lubao",
    "San Nicolas 2nd, Lubao",
    "San Pablo 1st, Lubao",
    "San Pablo 2nd, Lubao",
    "San Pedro Palcarangan, Lubao",
    "San Pedro Saug, Lubao",
    "San Roque Arbol, Lubao",
    "San Roque Dau, Lubao",
    "San Vicente, Lubao",
    "Santa Barbara, Lubao",
    "Santa Catalina, Lubao",
    "Santa Cruz, Lubao",
    "Santa Lucia, Lubao",
    "Santa Maria, Lubao",
    "Santa Monica, Lubao",
    "Santa Rita, Lubao",
    "Santa Teresa 1st, Lubao",
    "Santa Teresa 2nd, Lubao",
    "Santiago, Lubao",
    "Santo Cristo, Lubao",
    "Santo Domingo, Lubao",
    "Santo Niño, Lubao",
    "Santo Tomas, Lubao",
  ],
  Mabalacat: [
    "Atlu-Bola, Mabalacat",
    "Bical, Mabalacat",
    "Bundagul, Mabalacat",
    "Cacutud, Mabalacat",
    "Calumpang, Mabalacat",
    "Camachiles, Mabalacat",
    "Dapdap, Mabalacat",
    "Dau, Mabalacat",
    "Dolores, Mabalacat",
    "Duquit, Mabalacat",
    "Lakandula, Mabalacat",
    "Mabiga, Mabalacat",
    "Macapagal Village, Mabalacat",
    "Mamatitang, Mabalacat",
    "Mangalit, Mabalacat",
    "Marcos Village, Mabalacat",
    "Mawaque, Mabalacat",
    "Paralayunan, Mabalacat",
    "Poblacion, Mabalacat",
    "San Francisco, Mabalacat",
    "San Joaquin, Mabalacat",
    "Santa Ines, Mabalacat",
    "Santa Maria, Mabalacat",
    "Santo Rosario, Mabalacat",
    "Sapang Balen, Mabalacat",
    "Sapang Biabas, Mabalacat",
    "Tabun, Mabalacat",
  ],
  Macabebe: [
    "Batasan, Macabebe",
    "Caduang Tete, Macabebe",
    "Candelaria, Macabebe",
    "Castuli, Macabebe",
    "Consuelo, Macabebe",
    "Dalayap, Macabebe",
    "Mataguiti, Macabebe",
    "San Esteban, Macabebe",
    "San Francisco, Macabebe",
    "San Gabriel, Macabebe",
    "San Isidro, Macabebe",
    "San Jose, Macabebe",
    "San Juan, Macabebe",
    "San Rafael, Macabebe",
    "San Roque, Macabebe",
    "San Vicente, Macabebe",
    "Santa Cruz, Macabebe",
    "Santa Lutgarda, Macabebe",
    "Santa Maria, Macabebe",
    "Santa Rita, Macabebe",
    "Santo Niño, Macabebe",
    "Santo Rosario, Macabebe",
    "Saplad David, Macabebe",
    "Tacasan, Macabebe",
    "Telacsan, Macabebe",
  ],
  Magalang: [
    "Ayala, Magalang",
    "Bucanan, Magalang",
    "Camias, Magalang",
    "Dolores, Magalang",
    "Escaler, Magalang",
    "La Paz, Magalang",
    "Navaling, Magalang",
    "San Agustin, Magalang",
    "San Antonio, Magalang",
    "San Franciso, Magalang",
    "San Ildefonso, Magalang",
    "San Isidro, Magalang",
    "San Jose, Magalang",
    "San Miguel, Magalang",
    "San Nicolas 1st, Magalang",
    "San Nicolas 2nd, Magalang",
    "San Pablo, Magalang",
    "San Pedro I, Magalang",
    "San Pedro II, Magalang",
    "San Roque, Magalang",
    "San Vicente, Magalang",
    "Santa Cruz, Magalang",
    "Santa Lucia, Magalang",
    "Santa Maria, Magalang",
    "Santo Niño, Magalang",
    "Santo Rosario, Magalang",
    "Turu, Magalang",
  ],
  Masantol: [
    "Alauli, Masantol",
    "Bagang, Masantol",
    "Balibago, Masantol",
    "Bebe Anac, Masantol",
    "Bebe Matua, Masantol",
    "Bulacus, Masantol",
    "Cambasi, Masantol",
    "Malauli, Masantol",
    "Nigui, Masantol",
    "Palimpe, Masantol",
    "Puti, Masantol",
    "Sagrada, Masantol",
    "San Agustin, Masantol",
    "San Isidro Anac, Masantol",
    "San Isidro Matua, Masantol",
    "San Nicolas, Masantol",
    "San Pedro, Masantol",
    "Santa Cruz, Masantol",
    "Santa Lucia Anac, Masantol",
    "Santa Lucia Matua, Masantol",
    "Santa Lucia Paguiba, Masantol",
    "Santa Lucia Wakas, Masantol",
    "Santa Monica, Masantol",
    "Santo Niño, Masantol",
    "Sapang Kawayan, Masantol",
    "Sua, Masantol",
  ],
  Mexico: [
    "Acli, Mexico",
    "Anao, Mexico",
    "Balas, Mexico",
    "Buenavista, Mexico",
    "Camuning, Mexico",
    "Cawayan, Mexico",
    "Concepcion, Mexico",
    "Culubasa, Mexico",
    "Divisoria, Mexico",
    "Dolores, Mexico",
    "Eden, Mexico",
    "Gandus, Mexico",
    "Lagundi, Mexico",
    "Laput, Mexico",
    "Laug, Mexico",
    "Masamat, Mexico",
    "Masangsang, Mexico",
    "Nueva Victoria, Mexico",
    "Pandacaqui, Mexico",
    "Pangatlan, Mexico",
    "Panipuan, Mexico",
    "Parian, Mexico",
    "Sabanilla, Mexico",
    "San Antonio, Mexico",
    "San Carlos, Mexico",
    "San Jose Malino, Mexico",
    "San Jose Matulid, Mexico",
    "San Juan, Mexico",
    "San Lorenzo, Mexico",
    "San Miguel, Mexico",
    "San Nicolas, Mexico",
    "San Pablo, Mexico",
    "San Patricio, Mexico",
    "San Rafael, Mexico",
    "San Roque, Mexico",
    "San Vicente, Mexico",
    "Santa Cruz, Mexico",
    "Santa Maria, Mexico",
    "Santo Domingo, Mexico",
    "Santo Rosario, Mexico",
    "Sapang Maisac, Mexico",
    "Suclaban, Mexico",
    "Tangle, Mexico",
  ],
  Minalin: [
    "Bulac, Minalin",
    "Dawe, Minalin",
    "Lourdes, Minalin",
    "Maniango, Minalin",
    "San Francisco 1st, Minalin",
    "San Francisco 2nd, Minalin",
    "San Isidro, Minalin",
    "San Nicolas, Minalin",
    "San Pedro, Minalin",
    "Santa Catalina, Minalin",
    "Santa Maria, Minalin",
    "Santa Rita, Minalin",
    "Santo Domingo, Minalin",
    "Santo Rosario, Minalin",
    "Saplad, Minalin",
  ],
  Porac: [
    "Babo Pangulo, Porac",
    "Babo Sacan, Porac",
    "Balubad, Porac",
    "Calzadang Bayu, Porac",
    "Camias, Porac",
    "Cangatba, Porac",
    "Diaz, Porac",
    "Dolores, Porac",
    "Inararo, Porac",
    "Jalung, Porac",
    "Mancatian, Porac",
    "Manibaug Libutad, Porac",
    "Manibaug Paralaya, Porac",
    "Manibaug Pasig, Porac",
    "Manuali, Porac",
    "Mitla Proper, Porac",
    "Palat, Porac",
    "Pias, Porac",
    "Pio, Porac",
    "Planas, Porac",
    "Poblacion, Porac",
    "Pulong Santol, Porac",
    "Salu, Porac",
    "San Jose Mitla, Porac",
    "Santa Cruz, Porac",
    "Sapang Uwak, Porac",
    "Sepung Bulaun, Porac",
    "Sinura, Porac",
    "Villa Maria, Porac",
  ],
  "San Fernando": [
    "Alasas, San Fernando",
    "Baliti, San Fernando",
    "Bulaon, San Fernando",
    "Calulut, San Fernando",
    "Del Carmen, San Fernando",
    "Del Pilar, San Fernando",
    "Del Rosario, San Fernando",
    "Dela Paz Norte, San Fernando",
    "Dela Paz Sur, San Fernando",
    "Dolores, San Fernando",
    "Juliana, San Fernando",
    "Lara, San Fernando",
    "Lourdes, San Fernando",
    "Magliman, San Fernando",
    "Maimpis, San Fernando",
    "Malino, San Fernando",
    "Malpitic, San Fernando",
    "Pandaras, San Fernando",
    "Panipuan, San Fernando",
    "Pulung Bulu, San Fernando",
    "Quebiauan, San Fernando",
    "Saguin, San Fernando",
    "San Agustin, San Fernando",
    "San Felipe, San Fernando",
    "San Isidro, San Fernando",
    "San Jose, San Fernando",
    "San Juan, San Fernando",
    "San Nicolas, San Fernando",
    "San Pedro, San Fernando",
    "Santa Lucia, San Fernando",
    "Santa Teresita, San Fernando",
    "Santo Niño, San Fernando",
    "Santo Rosario, San Fernando",
    "Sindalan, San Fernando",
    "Telabastagan, San Fernando",
  ],
  "San Luis": [
    "San Agustin, San Luis",
    "San Carlos, San Luis",
    "San Isidro, San Luis",
    "San Jose, San Luis",
    "San Juan, San Luis",
    "San Nicolas, San Luis",
    "San Roque, San Luis",
    "San Sebastian, San Luis",
    "Santa Catalina, San Luis",
    "Santa Cruz Pambilog, San Luis",
    "Santa Cruz Poblacion, San Luis",
    "Santa Lucia, San Luis",
    "Santa Monica, San Luis",
    "Santa Rita, San Luis",
    "Santo Niño, San Luis",
    "Santo Rosario, San Luis",
    "Santo Tomas, San Luis",
  ],
  "San Simon": [
    "Concepcion, San Simon",
    "De La Paz, San Simon",
    "San Agustin, San Simon",
    "San Isidro, San Simon",
    "San Jose, San Simon",
    "San Juan, San Simon",
    "San Miguel, San Simon",
    "San Nicolas, San Simon",
    "San Pablo Libutad, San Simon",
    "San Pablo Proper, San Simon",
    "San Pedro, San Simon",
    "Santa Cruz, San Simon",
    "Santa Monica, San Simon",
    "Santo Niño, San Simon",
  ],
  "Santa Ana": [
    "San Agustin, Santa Ana",
    "San Bartolome, Santa Ana",
    "San Isidro, Santa Ana",
    "San Joaquin, Santa Ana",
    "San Jose, Santa Ana",
    "San Juan, Santa Ana",
    "San Nicolas, Santa Ana",
    "San Pablo, Santa Ana",
    "San Pedro, Santa Ana",
    "San Roque, Santa Ana",
    "Santa Lucia, Santa Ana",
    "Santa Maria, Santa Ana",
    "Santiago, Santa Ana",
    "Santo Rosario, Santa Ana",
  ],
  "Santa Rita": [
    "Becuran, Santa Rita",
    "Dila-dila, Santa Rita",
    "San Agustin, Santa Rita",
    "San Basilio, Santa Rita",
    "San Isidro, Santa Rita",
    "San Jose, Santa Rita",
    "San Juan, Santa Rita",
    "San Matias, Santa Rita",
    "San Vicente, Santa Rita",
    "Santa Monica, Santa Rita",
  ],
  "Santo Tomas": [
    "Moras de La Paz, Santo Tomas",
    "Poblacion, Santo Tomas",
    "San Bartolome, Santo Tomas",
    "San Matias, Santo Tomas",
    "San Vicente, Santo Tomas",
    "Santo Rosario, Santo Tomas",
    "Sapa, Santo Tomas",
  ],
  Sasmuan: [
    "Batang 1st, Sasmuan",
    "Batang 2nd, Sasmuan",
    "Mabuanbuan, Sasmuan",
    "Malusac, Sasmuan",
    "Sabitanan, Sasmuan",
    "San Antonio, Sasmuan",
    "San Nicolas 1st, Sasmuan",
    "San Nicolas 2nd, Sasmuan",
    "San Pedro, Sasmuan",
    "Santa Lucia, Sasmuan",
    "Santa Monica, Sasmuan",
    "Santo Tomas, Sasmuan",
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const querySection = searchParams?.get("section") ?? "profile";

  // UI State
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "profile"
  );
  const [activeOrdersTab, setActiveOrdersTab] = useState("All");
  const [confirmedOrders, setConfirmedOrders] = useState<Set<string>>(
    new Set()
  );

  // Loading States
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Error States
  const [profileError, setProfileError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  // Add these state declarations with your other useState hooks
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);

  // Profile Data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postal, setPostal] = useState("");
  const [region, setRegion] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>(
    DEFAULT_PROFILE_PICTURE
  );
  const [isProfilePictureLoaded, setIsProfilePictureLoaded] = useState(false);
  const [isSeller, setIsSeller] = useState(false); // Track if user is a seller

  // Orders Data
  const [orders, setOrders] = useState<any[]>([]);

  // Load cached profile picture on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedPicture = localStorage.getItem("cached_profile_picture");
      if (cachedPicture) {
        setProfilePicture(cachedPicture);
      } else if (session?.user?.image) {
        setProfilePicture(session.user.image);
      }
    }
  }, [session?.user?.image]);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (querySection) {
      // If user is a seller and tries to access "selling", redirect to "myshop"
      if (querySection === "selling" && isSeller) {
        setActiveSection("myshop");
      } else {
        setActiveSection(querySection);
      }

      if (querySection === "profile") setExpandedSection("profile");
      else setExpandedSection(null);
    }
  }, [querySection, isSeller]);

  const handleSelectSection = (section: string) => {
    // If user is a seller and tries to access "selling", redirect to "myshop"
    if (section === "selling" && isSeller) {
      setActiveSection("myshop");
    } else {
      setActiveSection(section);
    }

    if (section !== "profile") setExpandedSection(null);
    else setExpandedSection("profile");
  };

  const toggleExpanded = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const findRegionByProvince = (prov?: string) => {
    if (!prov) return "";
    for (const regionKey of Object.keys(regionProvinceCityData)) {
      const provinces = Object.keys(regionProvinceCityData[regionKey] || {});
      if (provinces.includes(prov)) return regionKey;
    }
    return "";
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;

      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const response = await fetch("/api/user/profile", {
          // Add cache control for faster subsequent loads
          headers: {
            "Cache-Control": "max-age=300", // Cache for 5 minutes
          },
        });
        const data = await response.json();

        if (data.success) {
          setFullName(data.data.fullName || "");
          setEmail(data.data.email || "");
          setPhone(data.data.phone || "");
          setStreet(data.data.address.street || "");
          setBarangay(data.data.address.barangay || "");
          setCity(data.data.address.city || "");
          setProvince(data.data.address.province || "");
          setRegion(data.data.address.region || "");
          setPostal(data.data.address.postalCode || "");
          setSelectedGender(data.data.gender || "");

          // Only update profile picture if we have a new one
          const newProfilePicture =
            data.data.profilePicture || session?.user?.image || "";
          if (newProfilePicture && newProfilePicture !== profilePicture) {
            // Preload the image before setting it
            const img = document.createElement("img");
            img.onload = () => {
              setProfilePicture(newProfilePicture);
              // Cache in localStorage for instant load next time
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  "cached_profile_picture",
                  newProfilePicture
                );
              }
              setIsProfilePictureLoaded(true);
            };
            img.onerror = () => {
              setIsProfilePictureLoaded(true);
            };
            img.src = newProfilePicture;
          } else {
            setIsProfilePictureLoaded(true);
          }

          // Check seller status more thoroughly
          const userIsSeller = data.data.isSeller || false;
          setIsSeller(userIsSeller);

          // If user claims to be a seller, verify their status
          if (userIsSeller) {
            try {
              const sellerStatusResponse = await fetch("/api/seller/status");
              const sellerStatusData = await sellerStatusResponse.json();
              
              if (sellerStatusData.success) {
                // Only consider them a seller if application is approved
                const isApprovedSeller = sellerStatusData.data.isSeller && 
                  sellerStatusData.data.applicationStatus === 'approved';
                setIsSeller(isApprovedSeller);
              }
            } catch (sellerError) {
              console.error("Error fetching seller status:", sellerError);
              // Fall back to the original isSeller value
            }
          }
        } else {
          setProfileError(data.message || "Failed to load profile");
          setIsProfilePictureLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileError("Failed to load profile");
        setIsProfilePictureLoaded(true);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session]);

  // Refresh seller status from server
  const refreshSellerStatus = async () => {
    try {
      const response = await fetch("/api/seller/status");
      const data = await response.json();
      
      if (data.success) {
        const isApprovedSeller = data.data.isSeller && 
          data.data.applicationStatus === 'approved';
        setIsSeller(isApprovedSeller);
        
        // If user became a seller, switch to My Shop
        if (isApprovedSeller && activeSection === "selling") {
          setActiveSection("myshop");
        }
        
        return isApprovedSeller;
      }
    } catch (error) {
      console.error("Error refreshing seller status:", error);
    }
    return false;
  };

  // Fetch seller profile if user is a seller
  const fetchSellerProfile = async () => {
    try {
      console.log("Fetching seller profile...");
      const response = await fetch("/api/seller/profile");
      const data = await response.json();

      console.log("Seller profile response:", data);

      if (data.success && data.data) {
        console.log("Setting seller profile state:", {
          shopName: data.data.shopName,
          sellerStoryTitle: data.data.sellerStoryTitle,
          sellerStory: data.data.sellerStory?.substring(0, 50),
        });

        // Update all seller-related state
        setShopName(data.data.shopName || "");
        setShopDescription(data.data.shopDescription || "");
        setPickupBarangay(data.data.pickupAddress?.barangay || "");
        setPickupAddress(data.data.pickupAddress?.otherDetails || "");
        setShopEmail(data.data.shopEmail || "");
        setShopPhone(data.data.shopPhone || "");
        setSocialMediaLinks(data.data.socialMediaLinks || {});
        setSellerStoryTitle(data.data.sellerStoryTitle || "");
        setSellerStory(data.data.sellerStory || "");

        // Set seller photo preview if available
        if (data.data.sellerPhoto) {
          const previewEl = document.getElementById(
            "sellerPhotoPreview"
          ) as HTMLImageElement;
          if (previewEl) {
            previewEl.src = data.data.sellerPhoto;
          }
        }
      } else {
        console.log("Failed to fetch seller profile:", data.message);
        // If profile fetch fails, verify seller status
        await refreshSellerStatus();
      }
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      // If there's an error, verify seller status
      await refreshSellerStatus();
    }
  };

  // Fetch seller profile when isSeller is true or when activeSection is myshop
  useEffect(() => {
    if (isSeller && session?.user) {
      fetchSellerProfile();
    }
  }, [isSeller, session?.user]);

  // Check seller status periodically when on selling page
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSection === "selling" && !isSeller) {
      // Check seller status every 10 seconds while on selling page
      interval = setInterval(() => {
        refreshSellerStatus();
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeSection, isSeller]);

  // Also fetch when navigating to myshop section
  useEffect(() => {
    if (activeSection === "myshop" && isSeller && session?.user) {
      fetchSellerProfile();
    }
  }, [activeSection]);

  // Submit seller application
  const handleSubmitSellerApplication = async () => {
    try {
      // Upload valid ID first if not already uploaded
      let validIdFileUrl = "";
      if (validIdFile) {
        const formData = new FormData();
        formData.append("file", validIdFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          alert("Failed to upload valid ID");
          return;
        }
        validIdFileUrl = uploadData.data.url;
      }

      // Upload seller photo if provided
      let sellerPhotoUrl = "";
      if (sellerPhotos.length > 0) {
        const sellerPhotoFormData = new FormData();
        sellerPhotoFormData.append("file", sellerPhotos[0]);
        sellerPhotoFormData.append("folder", "profiles");

        const sellerPhotoResponse = await fetch("/api/upload", {
          method: "POST",
          body: sellerPhotoFormData,
        });

        const sellerPhotoData = await sellerPhotoResponse.json();
        if (!sellerPhotoData.success) {
          alert(sellerPhotoData.message || "Failed to upload story photo");
          return false;
        }
        sellerPhotoUrl = sellerPhotoData.data.url;
      } else {
        const sellerPhotoEl = document.getElementById(
          "sellerPhotoPreview"
        ) as HTMLImageElement;
        sellerPhotoUrl = sellerPhotoEl?.src || "";
      }

      // Prepare application data
      const applicationData = {
        shopName,
        shopDescription: "", // Empty string since field was removed
        pickupAddress: {
          city: city,
          barangay: pickupBarangay,
          otherDetails: pickupAddress || "",
        },
        shopEmail,
        shopPhone,
        socialMediaLinks,
        sellerStoryTitle,
        sellerStory,
        sellerPhoto: sellerPhotoUrl,
        validIdUrl: validIdFileUrl,
        agreedToTerms,
        agreedToCommission,
        agreedToShipping,
      };

      // Submit application
      const response = await fetch("/api/seller/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (data.success) {
        // Update seller status immediately
        setIsSeller(true);

        // Fetch the updated seller profile
        await fetchSellerProfile();

        // Switch to My Shop section
        setActiveSection("myshop");

        // Show success modal
        setShowSubmitModal(true);

        // Reset form state
        setActiveStep(0);
        setSellerPhotos([]);

        return true;
      } else {
        alert(data.message || "Failed to submit application");
        return false;
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
      return false;
    }
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user || activeSection !== "orders") return;

      setIsLoadingOrders(true);
      setOrdersError("");

      try {
        const statusParam =
          activeOrdersTab === "All" ? "all" : activeOrdersTab.toLowerCase();
        const response = await fetch(`/api/user/orders?status=${statusParam}`);
        const data = await response.json();

        if (data.success) {
          setOrders(data.data || []);
        } else {
          setOrdersError(data.message || "Failed to load orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersError("Failed to load orders");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [session, activeSection, activeOrdersTab]);

  // Validation Functions
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^(09|\+639)\d{9}$/;
    return re.test(phone);
  };

  const validatePostalCode = (code: string) => {
    return /^\d{4}$/.test(code);
  };

  const validateProfileForm = () => {
    const errors = [];

    if (!fullName.trim()) errors.push("Full name is required");
    if (!email.trim()) errors.push("Email is required");
    if (!validateEmail(email)) errors.push("Invalid email format");
    if (phone && !validatePhone(phone))
      errors.push("Invalid phone format (09XXXXXXXXX)");
    if (postal && !validatePostalCode(postal))
      errors.push("Invalid postal code (4 digits)");
    if (!region) errors.push("Region is required");
    if (!province) errors.push("Province is required");
    if (!city) errors.push("City is required");

    return errors;
  };

  // Save Profile Handler
  const handleSaveProfile = async () => {
    const errors = validateProfileForm();

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setIsSaving(true);
    setProfileError("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          address: {
            street,
            barangay,
            city,
            province,
            region,
            postalCode: postal,
          },
          gender: selectedGender,
          profilePicture,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with saved data
        if (data.data) {
          setFullName(data.data.fullName || "");
          setPhone(data.data.phone || "");
          setStreet(data.data.address?.street || "");
          setBarangay(data.data.address?.barangay || "");
          setCity(data.data.address?.city || "");
          setProvince(data.data.address?.province || "");
          setRegion(data.data.address?.region || "");
          setPostal(data.data.address?.postalCode || "");
          setSelectedGender(data.data.gender || "");
          if (data.data.profilePicture) {
            setProfilePicture(data.data.profilePicture);
          }
        }
        setShowSaveModal(true);
        setTimeout(() => setShowSaveModal(false), 2000);
      } else {
        setShowSaveError(true);
        setProfileError(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      setShowSaveError(true);
      setProfileError("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Picture Upload Handler
  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Maximum size is 5MB");
      return;
    }

    try {
      // Upload the image first
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        const newProfilePicture = uploadData.data.url;

        // Update user profile with new picture AND all other fields
        const updateResponse = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            phone,
            address: {
              street,
              barangay,
              city,
              province,
              region,
              postalCode: postal,
            },
            gender: selectedGender,
            profilePicture: newProfilePicture,
          }),
        });

        const updateData = await updateResponse.json();

        if (updateData.success) {
          // Update local state
          setProfilePicture(newProfilePicture);
          // Update cache
          if (typeof window !== "undefined") {
            localStorage.setItem("cached_profile_picture", newProfilePicture);
          }
          alert("Profile picture updated successfully!");
        } else {
          alert(updateData.message || "Failed to update profile picture");
        }
      } else {
        alert(uploadData.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    }
  };

  // Confirm Order Receipt Handler
  const handleConfirmReceiptAPI = async (orderId: string) => {
    try {
      const response = await fetch(`/api/user/orders/${orderId}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setConfirmedOrders((prev) => new Set(prev).add(orderId));
        setActiveOrdersTab("Completed");
        setSuccessMessage("Order confirmed as received!");
        setShowSuccessModal(true);

        // Refresh orders
        const statusParam =
          activeOrdersTab === "All" ? "all" : activeOrdersTab.toLowerCase();
        const ordersResponse = await fetch(
          `/api/user/orders?status=${statusParam}`
        );
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          setOrders(ordersData.data || []);
        }
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Failed to confirm order");
    }
  };

  // Rate Order Handler
  const handleRateOrderAPI = async (orderId: string, rating: number) => {
    try {
      const response = await fetch(`/api/user/orders/${orderId}/rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderRatings((prev) => ({ ...prev, [orderId]: rating }));
        setSuccessMessage("Thank you for rating!");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      }
    } catch (error) {
      console.error("Error rating order:", error);
      alert("Failed to rate order");
    }
  };

  const [highlightRegion, setHighlightRegion] = useState(false);
  const regionRef = useRef<HTMLSelectElement | null>(null);
  const [regionTooltip, setRegionTooltip] = useState("");
  const [highlightProvince, setHighlightProvince] = useState(false);
  const [provinceTooltip, setProvinceTooltip] = useState("");
  const provinceRef = useRef<HTMLSelectElement | null>(null);
  const [highlightCity, setHighlightCity] = useState(false);
  const [cityTooltip, setCityTooltip] = useState("");
  const cityRef = useRef<HTMLSelectElement | null>(null);
  const [highlightBarangay, setHighlightBarangay] = useState(false);
  const [barangayTooltip, setBarangayTooltip] = useState("");
  const barangayRef = useRef<HTMLSelectElement | null>(null);

  function emphasizeField(
    setHighlight: (v: boolean) => void,
    setTooltip: (v: string) => void,
    ref: React.RefObject<any>,
    tooltipMsg: string,
    duration = 2000
  ) {
    setHighlight(true);
    setTooltip(tooltipMsg);
    setTimeout(
      () =>
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50
    );
    ref.current?.focus?.();
    setTimeout(() => {
      setHighlight(false);
      setTooltip("");
    }, duration);
  }

  const provincesForRegion = region
    ? Object.keys(regionProvinceCityData[region] || {})
    : [];
  const citiesForProvince =
    region && province ? regionProvinceCityData[region]?.[province] ?? [] : [];

  const emphasizeRegion = (duration = 2000) => {
    setHighlightRegion(true);
    setTimeout(
      () =>
        regionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      50
    );
    regionRef.current?.focus?.();
    window.setTimeout(() => setHighlightRegion(false), duration);
  };

  const [orderRatings, setOrderRatings] = useState<Record<string, number>>({});
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [orderRating, setOrderRating] = useState<number | null>(5);

  const handleConfirmReceipt = (orderId: string) => {
    setPendingOrderId(orderId);
    setShowConfirmModal(true);
  };

  const confirmReceipt = async () => {
    if (!pendingOrderId) return;

    setShowConfirmModal(false);
    setLoadingConfirm(true);

    await handleConfirmReceiptAPI(pendingOrderId);
    setLoadingConfirm(false);
    setPendingOrderId(null);
  };

  const cancelConfirmReceipt = () => {
    setShowConfirmModal(false);
    setPendingOrderId(null);
  };

  const handleRateOrder = async (orderId: string, rating: number) => {
    await handleRateOrderAPI(orderId, rating);
  };

  const [activeStep, setActiveStep] = useState(0);
  const [shopName, setShopName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupOther, setPickupOther] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [sellerStory, setSellerStory] = useState("");

  const [pickupBarangay, setPickupBarangay] = useState("");

  const [validIdFile, setValidIdFile] = useState<File | null>(null);
  const [isValidatingId, setIsValidatingId] = useState(false);

  const [sellerStoryTitle, setSellerStoryTitle] = useState("");

  // New enhanced fields
  const [shopDescription, setShopDescription] = useState("");
  const [businessHours, setBusinessHours] = useState({
    monday: { open: "09:00", close: "17:00", enabled: true },
    tuesday: { open: "09:00", close: "17:00", enabled: true },
    wednesday: { open: "09:00", close: "17:00", enabled: true },
    thursday: { open: "09:00", close: "17:00", enabled: true },
    friday: { open: "09:00", close: "17:00", enabled: true },
    saturday: { open: "09:00", close: "17:00", enabled: false },
    sunday: { open: "09:00", close: "17:00", enabled: false },
  });
  const [byAppointment, setByAppointment] = useState(false);
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: "",
    instagram: "",
    tiktok: "",
  });
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [productionCapacity, setProductionCapacity] = useState("");
  const [shippingOptions, setShippingOptions] = useState({
    pickupOnly: true,
    localDelivery: false,
    nationwide: false,
    international: false,
  });
  const [deliveryRadius, setDeliveryRadius] = useState("");
  const [sellerPhotos, setSellerPhotos] = useState<File[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCommission, setAgreedToCommission] = useState(false);
  const [agreedToShipping, setAgreedToShipping] = useState(false);
  const [craftType, setCraftType] = useState<string>("");

  // Add this state
  const [agreeToAll, setAgreeToAll] = useState(false);
  // Add this function with your other state declarations
  const handleAgreeToAll = (checked: boolean) => {
    setAgreeToAll(checked);
    setAgreedToTerms(checked);
    setAgreedToCommission(checked);
    setAgreedToShipping(checked);
  };

  // Then replace the inline hover style with a CSS class
  // Add this CSS to profile.css:
  // Validation functions for each step
  const isStep1Valid = () => {
    const validations = {
      shopName: shopName.trim().length >= 3 && shopName.trim().length <= 50,
      craftType: craftType.trim() !== "",
      city: city.trim() !== "",
      pickupBarangay: pickupBarangay.trim() !== "",
      shopEmail:
        shopEmail.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail),
      shopPhone: shopPhone.trim().length === 11 && /^[0-9]+$/.test(shopPhone),
      validIdFile: validIdFile !== null,
    };

    return Object.values(validations).every((v) => v === true);
  };

  const isStep2Valid = () => {
    return (
      sellerStoryTitle.trim() !== "" &&
      sellerStory.trim().length >= 10 &&
      sellerStory.trim().length <= 1000
    );
  };

  const isStep3Valid = () => {
    return agreedToTerms && agreedToCommission && agreedToShipping;
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalBoxStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "12px",
    padding: "30px 40px",
    width: "360px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.2s ease-in-out",
  };

  const modalTitleStyle: React.CSSProperties = {
    color: "#AF7928",
    marginBottom: "12px",
    fontSize: "1.2rem",
    fontWeight: 600,
  };

  const modalTextStyle: React.CSSProperties = {
    color: "#555",
    fontSize: "14px",
    marginBottom: "20px",
  };

  // Check if shop info is complete for saving
  const isShopInfoComplete = () => {
    const complete =
      shopName.trim().length >= 3 &&
      shopName.trim().length <= 50 &&
      craftType.trim() !== "" &&
      city.trim() !== "" &&
      pickupBarangay.trim() !== "" &&
      shopEmail.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail) &&
      shopPhone.trim().length === 11 &&
      /^[0-9]+$/.test(shopPhone) &&
      validIdFile !== null;

    if (!complete) {
      console.log("Shop info incomplete. Current state:", {
        shopName: `${shopName.length} chars (need 3-50)`,
        category: craftType || "EMPTY",
        craftType: craftType || "EMPTY",
        pickupBarangay: pickupBarangay || "EMPTY",
        pickupAddress: pickupAddress || "EMPTY",
        shopEmail: shopEmail || "EMPTY",
        shopPhone: `${shopPhone} (${shopPhone.length} digits, need 11)`,
        validIdFile: validIdFile?.name || "NO FILE",
      });
    }

    return complete;
  };

  return (
    <>
      <Navbar />
      <div className="profile-page-wrapper">
        <div className="profile-container">
          {isLoadingProfile ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              Loading profile...
            </div>
          ) : (
            <>
              <div className="profile-picture">
                <img
                  src={
                    profilePicture ||
                    session?.user?.image ||
                    DEFAULT_PROFILE_PICTURE
                  }
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    transition: "opacity 0.3s ease",
                  }}
                  loading="eager"
                  fetchPriority="high"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
                  }}
                />
                <input
                  id="profile-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="profile-upload-input"
                />
              </div>
              <div className="profile-name">
                {fullName || session?.user?.name || "User"}
              </div>
            </>
          )}
          <div className="edit-profile-row">
            <FaEdit className="edit-icon" />
            Edit profile
          </div>
          <hr className="profile-divider" />

          {/* My Profile */}
          <div className="profile-section">
            <div
              className="profile-section-row"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
                onClick={() => toggleExpanded("profile")}
              >
                <FaUser className="profile-section-icon" />
                <span className="profile-section-title">My Profile</span>
              </div>

              {expandedSection === "profile" && (
                <span
                  className={`profile-section-label ${
                    activeSection === "profile" ? "active" : ""
                  }`}
                  onClick={() => handleSelectSection("profile")}
                  tabIndex={0}
                  style={{
                    marginLeft: "37px",
                    marginTop: "16px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                >
                  Profile
                </span>
              )}
            </div>
          </div>

          {/* My Orders */}
          <div className="profile-section">
            <div
              className={`profile-section-row ${
                activeSection === "orders" ? "active" : ""
              }`}
              onClick={() => handleSelectSection("orders")}
              tabIndex={0}
            >
              <FaShoppingCart className="profile-section-icon" />
              <span className="profile-section-title">My Orders</span>
            </div>
          </div>

          {/* Wishlist */}
          <div className="profile-section">
            <div
              className={`profile-section-row ${
                activeSection === "wishlist" ? "active" : ""
              }`}
              onClick={() => handleSelectSection("wishlist")}
              tabIndex={0}
            >
              <FaHeart className="profile-section-icon" />
              <span className="profile-section-title">My Wishlist</span>
            </div>
          </div>

          {/* Start Selling / My Shop toggle in sidebar */}
          {!isLoadingProfile && (
            <div className="profile-section">
              <div
                // when user is a seller, this nav item becomes "myshop"
                className={`profile-section-row ${
                  activeSection === (isSeller ? "myshop" : "selling")
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSelectSection(isSeller ? "myshop" : "selling")
                }
                tabIndex={0}
              >
                {isSeller ? (
                  <FaStore className="profile-section-icon" />
                ) : (
                  <FaTags className="profile-section-icon" />
                )}
                <span className="profile-section-title">
                  {isSeller ? "My Shop" : "Start Selling"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="profile-details-box">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <>
              <div className="profile-details-title">
                <FaUser
                  className="profile-section-icon"
                  style={{
                    color: "#FFC46B",
                    fontSize: "2rem",
                    marginRight: "16px",
                    verticalAlign: "middle",
                  }}
                />
                My Profile
                <hr className="profile-details-divider" />
              </div>

              <div className="profile-details-inner-box">
                <div className="profile-upload-section">
                  <img
                    src={
                      profilePicture ||
                      session?.user?.image ||
                      DEFAULT_PROFILE_PICTURE
                    }
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
                    }}
                    alt="User"
                    className="profile-upload-image"
                    id="profilePreview"
                  />
                  <input
                    type="file"
                    id="profileUpload"
                    accept="image/*"
                    className="profile-upload-input"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file type
                      if (!file.type.startsWith("image/")) {
                        alert("Please select an image file");
                        return;
                      }

                      // Validate file size (1MB = 1048576 bytes)
                      if (file.size > 1048576) {
                        alert("Image too large. Maximum size is 1MB");
                        return;
                      }

                      try {
                        // Show preview immediately
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = document.getElementById(
                            "profilePreview"
                          ) as HTMLImageElement;
                          if (img && event.target?.result) {
                            img.src = event.target.result as string;
                          }
                        };
                        reader.readAsDataURL(file);

                        // Upload the image to server
                        const formData = new FormData();
                        formData.append("file", file);

                        const uploadResponse = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });

                        const uploadData = await uploadResponse.json();

                        if (uploadData.success) {
                          const newProfilePicture = uploadData.data.url;

                          // Update user profile with new picture AND all other fields
                          const updateResponse = await fetch(
                            "/api/user/profile",
                            {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                fullName,
                                phone,
                                address: {
                                  street,
                                  barangay,
                                  city,
                                  province,
                                  region,
                                  postalCode: postal,
                                },
                                gender: selectedGender,
                                profilePicture: newProfilePicture,
                              }),
                            }
                          );

                          const updateData = await updateResponse.json();

                          if (updateData.success) {
                            // Update local state
                            setProfilePicture(newProfilePicture);
                            alert("Profile picture updated successfully!");
                          } else {
                            alert(
                              updateData.message ||
                                "Failed to update profile picture"
                            );
                          }
                        } else {
                          alert(uploadData.message || "Failed to upload image");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        alert("Failed to upload image");
                      }
                    }}
                  />
                  <label htmlFor="profileUpload" className="profile-upload-btn">
                    Select Image
                  </label>
                  <p className="profile-upload-hint">
                    File size: maximum 1 MB <br />
                    File extension: .JPEG, .PNG
                  </p>
                </div>

                <hr className="profile-inner-divider" />

                <form className="profile-form">
                  {/* Full Name */}
                  <div className="form-row">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-row">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="form-row">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {/**DOUBLE ROWS START */}
                  {/* Date of Birth (left)  —  Gender (right) */}
                  <div className="form-row double-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" className="form-input" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <div
                        className="gender-options"
                        style={{ alignItems: "center" }}
                      >
                        <label className="gender-option">
                          <input type="radio" name="gender" value="male" />
                          <span className="custom-radio" />
                          Male
                        </label>
                        <label className="gender-option">
                          <input type="radio" name="gender" value="female" />
                          <span className="custom-radio" />
                          Female
                        </label>
                        <label className="gender-option">
                          <input type="radio" name="gender" value="other" />
                          <span className="custom-radio" />
                          Other
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Street (left)  —  Barangay (right) */}
                  <div className="form-row double-row">
                    <div className="form-group">
                      <label className="form-label">Street</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter street address"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Barangay</label>
                      <select
                        ref={barangayRef}
                        className={`form-input${
                          highlightBarangay ? " highlight" : ""
                        }`}
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        disabled={!city}
                        onMouseDown={(e) => {
                          if (!city) {
                            e.preventDefault();
                            emphasizeField(
                              setHighlightCity,
                              setCityTooltip,
                              cityRef,
                              "Please select a city first."
                            );
                          }
                        }}
                        onFocus={() => {
                          if (!city)
                            emphasizeField(
                              setHighlightCity,
                              setCityTooltip,
                              cityRef,
                              "Please select a city first."
                            );
                        }}
                      >
                        <option value="">Select barangay</option>
                        {city &&
                          cityBarangayData[city]?.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* City (left)  —  Province (right) */}
                  <div className="form-row double-row">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <select
                        ref={cityRef}
                        className={`form-input${
                          highlightCity ? " highlight" : ""
                        }`}
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setBarangay("");
                        }}
                        required
                        onMouseDown={(e) => {
                          if (!province) {
                            e.preventDefault();
                            emphasizeField(
                              setHighlightProvince,
                              setProvinceTooltip,
                              provinceRef,
                              "Please select a province first."
                            );
                          }
                        }}
                        onFocus={() => {
                          if (!province)
                            emphasizeField(
                              setHighlightProvince,
                              setProvinceTooltip,
                              provinceRef,
                              "Please select a province first."
                            );
                        }}
                        disabled={!province}
                      >
                        <option value="">Select city</option>
                        {citiesForProvince.map((cityName) => (
                          <option key={cityName} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Province</label>
                      <select
                        ref={provinceRef}
                        className={`form-input${
                          highlightProvince ? " highlight" : ""
                        }`}
                        value={province}
                        onChange={(e) => {
                          setProvince(e.target.value);
                          setCity("");
                          setBarangay("");
                          if (!region) {
                            const inferred = findRegionByProvince(
                              e.target.value
                            );
                            if (inferred) setRegion(inferred);
                          }
                        }}
                        required
                        onMouseDown={(e) => {
                          if (!region) {
                            e.preventDefault();
                            emphasizeField(
                              setHighlightRegion,
                              setRegionTooltip,
                              regionRef,
                              "Please select a region first."
                            );
                          }
                        }}
                        onFocus={() => {
                          if (!region)
                            emphasizeField(
                              setHighlightRegion,
                              setRegionTooltip,
                              regionRef,
                              "Please select a region first."
                            );
                        }}
                        disabled={!region && provincesForRegion.length > 0}
                      >
                        <option value="">Select province</option>
                        {provincesForRegion.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`form-row double-row`}>
                    <div
                      className={`form-group ${
                        highlightRegion ? "highlight" : ""
                      }`}
                    >
                      <label className="form-label">Region</label>
                      <select
                        ref={regionRef}
                        className={`form-input short-input${
                          highlightRegion ? " highlight" : ""
                        }`}
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setProvince("");
                          setCity("");
                          setBarangay("");
                          setHighlightRegion(false);
                          setRegionTooltip("");
                        }}
                        required
                      >
                        <option value="">Select region</option>
                        {regionList.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        className="form-input short-input"
                        placeholder="Enter postal code"
                        value={postal}
                        onChange={(e) => setPostal(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Save */}
                  <div
                    className="form-row"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <div className="form-button-wrapper">
                      <button
                        className="save-btn"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "SAVE"}
                      </button>
                    </div>
                  </div>

                  {/* Profile Error */}
                  {profileError && (
                    <div
                      style={{
                        color: "red",
                        textAlign: "center",
                        marginTop: "10px",
                      }}
                    >
                      {profileError}
                    </div>
                  )}
                </form>
              </div>
            </>
          )}

          {/* Orders Section */}
          {activeSection === "orders" && (
            <>
              <div className="profile-details-title">
                <FaShoppingCart
                  className="profile-section-icon"
                  style={{
                    color: "#FFC46B",
                    fontSize: "2rem",
                    marginRight: "16px",
                    verticalAlign: "middle",
                  }}
                />
                My Orders
                <hr className="profile-details-divider" />
              </div>

              <div className="profile-details-inner-box">
                <div className="orders-nav">
                  {[
                    "All",
                    "To Pay",
                    "To Ship",
                    "To Receive",
                    "Completed",
                    "Cancelled",
                  ].map((tab) => (
                    <div
                      key={tab}
                      className={`orders-tab ${
                        activeOrdersTab === tab ? "active" : ""
                      }`}
                      onClick={() => setActiveOrdersTab(tab)}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                <div className="orders-search">
                  <FaSearch className="orders-search-icon" />
                  <input
                    type="text"
                    placeholder="Search Seller Name or Product"
                    className="orders-search-input"
                  />
                </div>

                {/* Loading State */}
                {isLoadingOrders && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    Loading orders...
                  </div>
                )}

                {/* Error State */}
                {ordersError && (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "red",
                    }}
                  >
                    {ordersError}
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingOrders && !ordersError && orders.length === 0 && (
                  <div className="orders-empty-state">
                    <i className="fa-solid fa-box-open orders-empty-icon"></i>
                    <div className="orders-empty-title">No Order Found</div>
                    <div className="orders-empty-desc">
                      Looks like you haven't made your order yet.
                    </div>
                    <button
                      className="orders-empty-btn"
                      onClick={() => router.push("/marketplace")}
                    >
                      Shop Now
                    </button>
                  </div>
                )}

                {/* Orders will be dynamically rendered from API */}
                <div className="orders-content">
                  {/* Orders from database will appear here */}
                </div>
              </div>
            </>
          )}

          {/* Wishlist Section */}
          {activeSection === "wishlist" && (
            <>
              <div className="profile-details-title">
                <FaHeart
                  className="profile-section-icon"
                  style={{
                    color: "#FFC46B",
                    fontSize: "2rem",
                    marginRight: "16px",
                    verticalAlign: "middle",
                  }}
                />
                My Wishlist
                <hr className="profile-details-divider" />
              </div>

              <div className="profile-details-inner-box">
                <WishlistContent />
              </div>
            </>
          )}

          {/* Selling Section */}
          {activeSection === "selling" && !isSeller && (
            <>
              <div className="profile-details-title">
                <FaTags
                  className="profile-section-icon"
                  style={{
                    color: "#FFC46B",
                    fontSize: "2rem",
                    marginRight: "16px",
                    verticalAlign: "middle",
                  }}
                />
                Start Selling
                <hr className="profile-details-divider" />
              </div>

              <div className="profile-details-inner-box">
                {/* Progress Steps */}
                <div className="selling-progress">
                  {["Shop Information", "Seller Story", "Submit"].map(
                    (label, i) => {
                      const isActive = i === activeStep;
                      const isCompleted = i < activeStep;
                      return (
                        <React.Fragment key={label}>
                          <div
                            className="progress-step"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              className="circle"
                              style={{
                                backgroundColor: isCompleted
                                  ? "#4caf50"
                                  : isActive
                                  ? "#AF7928"
                                  : "rgba(0,0,0,0.15)",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "600",
                                fontSize: "16px",
                                transition: "all 0.3s ease",
                                animation: isActive
                                  ? "pulse 2s infinite"
                                  : "none",
                                boxShadow: isActive
                                  ? "0 0 0 4px rgba(175, 121, 40, 0.2)"
                                  : "none",
                              }}
                            >
                              {isCompleted ? "✓" : i + 1}
                            </div>
                            <span
                              className="label"
                              style={{
                                color:
                                  isCompleted || isActive
                                    ? "#333"
                                    : "rgba(0,0,0,0.4)",
                                fontWeight: isActive ? "600" : "400",
                                fontSize: "13px",
                                textAlign: "center",
                                maxWidth: "100px",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          {i < 2 && (
                            <div
                              className="progress-line"
                              style={{
                                backgroundColor: isCompleted
                                  ? "#4caf50"
                                  : "rgba(0,0,0,0.15)",
                                height: "2px",
                                flex: "1",
                                marginTop: "-20px",
                                transition: "all 0.3s ease",
                              }}
                            ></div>
                          )}
                        </React.Fragment>
                      );
                    }
                  )}
                </div>

                {/* Add keyframes for pulse animation */}
                <style>{`
                  @keyframes pulse {
                    0%, 100% {
                      transform: scale(1);
                    }
                    50% {
                      transform: scale(1.05);
                    }
                  }
                `}</style>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                    margin: "24px 0",
                  }}
                />

                {/* Step Contents */}
                {activeStep === 0 && (
                  <div className="selling-step-content">
                    <div className="form-row">
                      <label className="form-label">
                        Shop Name <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your Shop Name (3-50 characters)"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        minLength={3}
                        maxLength={50}
                        required
                      />
                      {shopName && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          {shopName.length}/50
                        </span>
                      )}
                    </div>



                    {/* Craft Type */}
                    <div className="form-row">
                      <label className="form-label">
                        Craft Type <span style={{ color: "#af7928" }}>*</span>
                      </label>
                      <select
                        className="form-input"
                        value={craftType}
                        onChange={(e) => setCraftType(e.target.value)}
                        required
                      >
                        <option value="">Select your primary craft type</option>
                        <option value="Weaving">Weaving</option>
                        <option value="Woodwork">Woodwork</option>
                        <option value="Pottery">Pottery</option>
                        <option value="Embroidery">Embroidery</option>
                        <option value="Basketry">Basketry</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Textile">Textile</option>
                        <option value="Jewelry Making">Jewelry Making</option>
                        <option value="Leatherwork">Leatherwork</option>
                        <option value="Cosmetics">Cosmetics</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label className="form-label">
                        Pickup Address <span style={{ color: "red" }}>*</span>
                      </label>
                      <div className="form-input-group">
                        <select
                          className="form-input"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setPickupBarangay(""); // Reset barangay when city changes
                          }}
                          required
                        >
                          <option value="">Select City</option>
                          {Object.keys(cityBarangayData).map((cityName) => (
                            <option key={cityName} value={cityName}>
                              {cityName}
                            </option>
                          ))}
                        </select>

                        <select
                          className="form-input"
                          value={pickupBarangay}
                          onChange={(e) => setPickupBarangay(e.target.value)}
                          disabled={!city}
                          required
                        >
                          <option value="">Select Barangay</option>
                          {city &&
                            cityBarangayData[city]?.map((brgy) => (
                              <option key={brgy} value={brgy}>
                                {brgy}
                              </option>
                            ))}
                        </select>

                        <input
                          type="text"
                          className="form-input"
                          placeholder="Street, Building, Unit No. (Optional)"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        Customers will use this address for product pickup
                      </span>
                    </div>

                    <div className="form-row">
                      <label className="form-label">
                        Email <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Enter Shop Email"
                        value={shopEmail}
                        onChange={(e) => setShopEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <label className="form-label">
                        Phone <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Enter Shop Phone (e.g., 09171234567)"
                        value={shopPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
                          if (value.length <= 11) {
                            setShopPhone(value);
                          }
                        }}
                        maxLength={11}
                        required
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color:
                            shopPhone.length === 11
                              ? "#4caf50"
                              : shopPhone.length > 0
                              ? "#e74c3c"
                              : "#666",
                          marginLeft: "8px",
                        }}
                      >
                        {shopPhone.length}/11 digits{" "}
                        {shopPhone.length === 11 && "✓"}
                      </span>
                    </div>

                    {/* Social Media Links (Optional) */}
                    <div style={{ marginTop: "24px", marginBottom: "16px" }}>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#AF7928",
                          marginBottom: "12px",
                        }}
                      >
                        Social Media (Optional)
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginBottom: "16px",
                        }}
                      >
                        Help customers discover more about your brand
                      </p>

                      <div className="form-row">
                        <label className="form-label">Facebook Page</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://facebook.com/yourpage"
                          value={socialMediaLinks.facebook}
                          onChange={(e) =>
                            setSocialMediaLinks({
                              ...socialMediaLinks,
                              facebook: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-row">
                        <label className="form-label">Instagram</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="@yourusername"
                          value={socialMediaLinks.instagram}
                          onChange={(e) =>
                            setSocialMediaLinks({
                              ...socialMediaLinks,
                              instagram: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-row">
                        <label className="form-label">TikTok</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="@yourusername"
                          value={socialMediaLinks.tiktok}
                          onChange={(e) =>
                            setSocialMediaLinks({
                              ...socialMediaLinks,
                              tiktok: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <label className="form-label">
                        Valid ID <span style={{ color: "red" }}>*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="form-input"
                        onChange={(e) =>
                          setValidIdFile(e.target.files?.[0] || null)
                        }
                        required
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          marginLeft: "12px",
                        }}
                      >
                        Upload a clear photo or scan of your valid ID.
                      </span>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div
                    className="selling-step-content"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "28px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "32px",
                      }}
                    >
                      <div style={{ flex: "0 0 200px" }}>
                        <span style={{ color: "red" }}>*</span>
                        <label className="form-label">Upload Photo</label>
                        <p style={{ fontSize: "14px", color: "#666" }}>
                          Upload a photo of you or your artwork.
                        </p>
                      </div>

                      <div
                        style={{
                          width: "520px",
                          height: "123px",
                          border: "1px dashed rgba(175, 121, 40, 0.5)",
                          borderRadius: "6px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          backgroundColor: "#fffdf8",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="sellerPhoto"
                          style={{
                            position: "absolute",
                            opacity: 0,
                            width: "100%",
                            height: "100%",
                            cursor: "pointer",
                            zIndex: 2,
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSellerPhotos([file]);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const preview = document.getElementById(
                                  "sellerPhotoPreview"
                                ) as HTMLImageElement;
                                const icon =
                                  document.getElementById("uploadIcon");
                                const message =
                                  document.getElementById("uploadMessage");

                                if (preview && event.target?.result) {
                                  preview.src = event.target.result as string;
                                  preview.style.display = "block";
                                }
                                if (icon) icon.style.display = "none";
                                if (message) message.style.display = "none";
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        <img
                          id="sellerPhotoPreview"
                          alt="Preview"
                          style={{
                            display: "none",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "6px",
                            zIndex: 1,
                          }}
                        />

                        <FaImage
                          id="uploadIcon"
                          style={{
                            fontSize: "32px",
                            color: "rgba(175, 121, 40, 0.6)",
                            zIndex: 0,
                          }}
                        />
                        <p
                          id="uploadMessage"
                          style={{
                            fontSize: "12px",
                            color: "rgba(0,0,0,0.5)",
                            marginTop: "8px",
                            zIndex: 0,
                          }}
                        >
                          Click to upload • Max size 2MB (JPG/PNG)
                        </p>
                      </div>
                    </div>

                    {/* Story Title Field */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "32px",
                      }}
                    >
                      <div style={{ flex: "0 0 200px" }}>
                        <span style={{ color: "red" }}>*</span>
                        <label className="form-label">Story Title</label>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: "32.5rem" }}
                        placeholder="Enter story title"
                        value={sellerStoryTitle}
                        onChange={(e) => setSellerStoryTitle(e.target.value)}
                        maxLength={80}
                        required
                      />
                    </div>

                    {/* Artist Story Section */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "32px",
                      }}
                    >
                      <div style={{ flex: "0  0 200px" }}>
                        <span style={{ color: "red" }}>*</span>
                        <label className="form-label">Artist Story</label>
                        <p style={{ fontSize: "14px", color: "#666" }}>
                          Share your journey, inspiration, and your craft
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <textarea
                          className="form-input"
                          style={{
                            width: "32.5rem",
                            minHeight: "10rem",
                            maxHeight: "25rem",
                            border: "1px solid rgba(175, 121, 40, 0.5)",
                            borderRadius: "8px",
                            resize: "none",
                            padding: "12px",
                            fontSize: "14px",
                            color: "#333",
                            lineHeight: "1.5",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                          }}
                          placeholder="Write your artist story here... Share your journey, what inspires you, how you got started, and what makes your work unique."
                          minLength={10}
                          maxLength={1000}
                          value={sellerStory}
                          onChange={(e) => {
                            setSellerStory(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height =
                              e.target.scrollHeight + "px";
                          }}
                          required
                        />
                        <span
                          style={{
                            fontSize: "12px",
                            color:
                              sellerStory.length >= 1000
                                ? "red"
                                : sellerStory.length >= 10
                                ? "#4caf50"
                                : "#888",
                            alignSelf: "flex-end",
                            marginTop: "6px",
                          }}
                        >
                          {sellerStory.length}/1000{" "}
                          {sellerStory.length >= 10 &&
                            sellerStory.length < 1000 &&
                            "✓"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="selling-step-content">
                    <p style={{ fontSize: "15px", marginBottom: "20px" }}>
                      Review your details before submitting your shop for
                      approval.
                    </p>

                    {/* What Happens Next Timeline */}
                    <div
                      style={{
                        backgroundColor: "#fff9f0",
                        borderRadius: "8px",
                        padding: "16px 20px",
                        border: "1px solid rgba(175, 121, 40, 0.3)",
                        marginBottom: "24px",
                      }}
                    >
                      <h4
                        style={{
                          marginBottom: "12px",
                          color: "#af7928",
                          fontSize: "15px",
                        }}
                      >
                        What Happens Next?
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontSize: "13px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: "600", marginBottom: "4px" }}
                          >
                            1. Review
                          </div>
                          <div style={{ color: "#666" }}>
                            We&apos;ll verify your details.
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: "600", marginBottom: "4px" }}
                          >
                            2. Approval
                          </div>
                          <div style={{ color: "#666" }}>
                            You&apos;ll receive an email notification with next
                            steps
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: "600", marginBottom: "4px" }}
                          >
                            3. Start Selling
                          </div>
                          <div style={{ color: "#666" }}>
                            Add products and start reaching customers!
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shop Information Card */}
                    <div
                      style={{
                        marginBottom: "16px",
                        backgroundColor: "#faf8f5",
                        borderRadius: "8px",
                        padding: "16px 20px",
                        border: "1px solid rgba(175,121,40,0.2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: "16px" }}>
                          Shop Information
                        </h4>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <strong>Shop Name:</strong>
                        <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                          {shopName}
                        </p>
                      </div>



                      {craftType && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>Craft Type:</strong>
                          <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                            {craftType}
                          </p>
                        </div>
                      )}

                      <div style={{ marginBottom: "10px" }}>
                        <strong>Pickup Address:</strong>
                        <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                          {city && pickupBarangay
                            ? `${pickupBarangay}, ${city}${
                                pickupAddress ? `, ${pickupAddress}` : ""
                              }`
                            : city || pickupBarangay || "Not provided"}
                        </p>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <strong>Contact Information:</strong>
                        <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                          Email: {shopEmail || "Not provided"}
                          <br />
                          Phone: {shopPhone || "Not provided"}
                        </p>
                      </div>

                      {(socialMediaLinks.facebook ||
                        socialMediaLinks.instagram ||
                        socialMediaLinks.tiktok) && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>Social Media:</strong>
                          {socialMediaLinks.facebook && (
                            <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                              Facebook: {socialMediaLinks.facebook}
                            </p>
                          )}
                          {socialMediaLinks.instagram && (
                            <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                              Instagram: {socialMediaLinks.instagram}
                            </p>
                          )}
                          {socialMediaLinks.tiktok && (
                            <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                              TikTok: {socialMediaLinks.tiktok}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seller Story Card */}
                    <div
                      style={{
                        marginBottom: "16px",
                        backgroundColor: "#faf8f5",
                        borderRadius: "8px",
                        padding: "16px 20px",
                        border: "1px solid rgba(175,121,40,0.2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4 style={{ margin: 0, fontSize: "15px" }}>
                          Your Story
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveStep(1)}
                          style={{
                            background: "none",
                            border: "1px solid rgba(175, 121, 40, 0.5)",
                            borderRadius: "4px",
                            padding: "4px 12px",
                            fontSize: "12px",
                            cursor: "pointer",
                            color: "#af7928",
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {sellerStoryTitle && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>Story Title:</strong>
                          <p style={{ margin: "4px 0 0 0", color: "#333" }}>
                            {sellerStoryTitle}
                          </p>
                        </div>
                      )}

                      <div style={{ marginBottom: "10px" }}>
                        <strong>Your Story:</strong>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            color: "#333",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {sellerStory || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Seller Agreements */}
                    <div
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        padding: "16px 20px",
                        border: "1px solid rgba(175,121,40,0.3)",
                        marginTop: "20px",
                      }}
                    >
                      <h4
                        style={{
                          marginBottom: "16px",
                          fontSize: "15px",
                          color: "#2E3F36",
                        }}
                      >
                        Seller Agreements
                      </h4>

                      {/* Agree to All Option */}
                      <label
                        className="agreement-label"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          marginBottom: "16px",
                          padding: "12px",
                          backgroundColor: "#faf8f5",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={agreeToAll}
                          onChange={(e) => handleAgreeToAll(e.target.checked)}
                          style={{
                            marginTop: "3px",
                            marginRight: "10px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ fontWeight: "600", color: "#2E3F36" }}>
                          Agree to All Terms & Conditions
                        </span>
                      </label>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Terms and Conditions */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "4px",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            style={{
                              marginTop: "3px",
                              marginRight: "10px",
                              cursor: "pointer",
                            }}
                            required
                          />
                          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                            I have read and agree to GrowLokal's Terms and
                            Conditions, including guidelines on product quality,
                            authenticity, and customer service.
                          </span>
                        </label>

                        {/* Commission Structure */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "4px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={agreedToCommission}
                            onChange={(e) =>
                              setAgreedToCommission(e.target.checked)
                            }
                            style={{
                              marginTop: "3px",
                              marginRight: "10px",
                              cursor: "pointer",
                            }}
                            required
                          />
                          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                            I understand and accept GrowLokal's commission
                            structure, where a platform service fee applies to
                            each completed sale.
                          </span>
                        </label>

                        {/* Shipping Agreement */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "4px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={agreedToShipping}
                            onChange={(e) =>
                              setAgreedToShipping(e.target.checked)
                            }
                            style={{
                              marginTop: "3px",
                              marginRight: "10px",
                              cursor: "pointer",
                            }}
                            required
                          />
                          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                            I commit to timely order processing, accurate stock
                            updates, and clear communication of shipping or
                            pickup details to customers.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                    margin: "24px 0",
                  }}
                />

                {/* Field Completion Status Helper */}
                {activeStep === 0 && !isShopInfoComplete() && (
                  <div
                    style={{
                      background: "#fff3cd",
                      border: "1px solid #ffc107",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      fontSize: "13px",
                      color: "#856404",
                    }}
                  >
                    <strong>Please complete all required fields:</strong>
                    <ul style={{ margin: "8px 0 0 20px", lineHeight: "1.8" }}>
                      {shopName.trim().length < 3 && (
                        <li>Shop Name (at least 3 characters)</li>
                      )}

                      {!craftType && <li>Craft Type</li>}
                      {!city && <li>Pickup City</li>}
                      {!pickupBarangay && <li>Pickup Barangay</li>}
                      {(!shopEmail.trim() ||
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail)) && (
                        <li>Valid Shop Email</li>
                      )}
                      {(shopPhone.trim().length !== 11 ||
                        !/^[0-9]+$/.test(shopPhone)) && (
                        <li>Shop Phone (exactly 11 digits)</li>
                      )}
                      {!validIdFile && <li>Valid ID Upload</li>}
                    </ul>
                  </div>
                )}

                <div className="selling-buttons" style={{ marginTop: "24px" }}>
                  <button
                    className="order-btn primary"
                    onClick={async () => {
                      if (activeStep === 0) {
                        // Validate Step 1 including OCR validation for ID
                        if (!isStep1Valid()) {
                          return; // Basic validation failed
                        }
                        
                        // Perform OCR validation on the uploaded ID
                        if (validIdFile) {
                          try {
                            setIsValidatingId(true);
                            console.log("Starting OCR validation for ID document...");
                            
                            // Create FormData for OCR API
                            const formData = new FormData();
                            formData.append('idDocument', validIdFile);
                            
                            const ocrResponse = await fetch('/api/ocr/validate-id', {
                              method: 'POST',
                              body: formData
                            });
                            
                            const ocrResult = await ocrResponse.json();
                            
                            console.log("OCR validation result:", ocrResult);
                            
                            if (!ocrResult.success || !ocrResult.validation?.isValidId) {
                              // Show specific error message
                              let errorMessage = "ID validation failed: ";
                              if (ocrResult.errors && ocrResult.errors.length > 0) {
                                errorMessage += ocrResult.errors.join(", ");
                              } else {
                                errorMessage += "The uploaded document does not appear to be a valid Philippine government ID.";
                              }
                              
                              alert(errorMessage + "\\n\\nPlease upload a clear photo of a valid Philippine government-issued ID.");
                              return; // Stop progression to Step 2
                            }
                            
                            // OCR validation passed
                            console.log(`ID validated successfully: ${ocrResult.validation?.detectedIdType || 'Government ID'} (${ocrResult.validation?.confidence || 0}% confidence)`);
                            
                          } catch (error) {
                            console.error("OCR validation error:", error);
                            alert("Unable to validate ID document. Please check your internet connection and try again.");
                            return;
                          } finally {
                            setIsValidatingId(false);
                          }
                        }
                        
                        // Move to Step 2 after successful validation
                        setActiveStep(1);
                        
                      } else if (activeStep < 2) {
                        setActiveStep(activeStep + 1);
                      } else {
                        // Submit the application
                        handleSubmitSellerApplication();
                      }
                    }}
                    disabled={
                      isValidatingId ||
                      (activeStep === 0 && !isStep1Valid()) ||
                      (activeStep === 1 && !isStep2Valid()) ||
                      (activeStep === 2 && !isStep3Valid())
                    }
                  >
                    {isValidatingId ? "Validating ID..." : (activeStep < 2 ? "Next" : "Submit")}
                  </button>

                  {activeStep > 0 && (
                    <button
                      className="order-btn secondary"
                      style={{ marginLeft: "8px" }}
                      onClick={() => setActiveStep(activeStep - 1)}
                    >
                      Back
                    </button>
                  )}
                </div>

                {showProgressModal && (
                  <div style={modalOverlayStyle}>
                    <div style={modalBoxStyle}>
                      <h3 style={modalTitleStyle}>Step Completed</h3>
                      <p style={modalTextStyle}>
                        You have successfully saved your details. Proceed to the
                        next step.
                      </p>
                      <button
                        className="order-btn primary"
                        onClick={() => setShowProgressModal(false)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {showSubmitModal && (
                  <div
                    style={modalOverlayStyle}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setShowSubmitModal(false);
                        setIsSeller(true);
                        setActiveSection("myshop");
                      }
                    }}
                  >
                    <div style={{ ...modalBoxStyle, position: "relative" }}>
                      <button
                        aria-label="Close"
                        onClick={() => {
                          setShowSubmitModal(false);
                          setIsSeller(true);
                          setActiveSection("myshop");
                        }}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "transparent",
                          border: "none",
                          fontSize: 20,
                          color: "#2e3f36",
                          cursor: "pointer",
                          padding: 6,
                        }}
                      >
                        ×
                      </button>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 16,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#28af53",
                            borderRadius: "50%",
                            width: 48,
                            height: 48,
                            color: "#fff",
                            fontSize: "2rem",
                          }}
                        >
                          ✓
                        </span>
                      </div>

                      <h3 style={modalTitleStyle}>Shop Registered</h3>
                      <p style={modalTextStyle}>
                        Your shop is registered. View it under My Shop in your
                        profile.
                      </p>

                      <button
                        className="order-btn primary"
                        onClick={() => {
                          setShowSubmitModal(false);
                          setIsSeller(true);
                          setActiveSection("myshop");
                        }}
                        style={{ marginBottom: 10 }}
                      >
                        Proceed to My Shop
                      </button>
                    </div>
                  </div>
                )}

                {showSuccessModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h3>Success</h3>
                      <p>{successMessage}</p>
                      <div className="modal-actions">
                        <button
                          className="order-btn primary"
                          onClick={() => setShowSuccessModal(false)}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/******** MY SHOP (visible after registering) ********/}

          {isSeller && activeSection === "myshop" && (
            <div
              className="myshop-dashboard"
              style={{ display: "flex", gap: "32px" }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Shop Card (shop picture + shop name) */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    padding: "5px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: "32px",
                  }}
                >
                  <img
                    src={
                      document
                        .getElementById("sellerPhotoPreview")
                        ?.getAttribute("src") ||
                      profilePicture ||
                      "/default-profile.jpg"
                    }
                    alt="Shop Image"
                    style={{
                      width: 65,
                      height: 65,
                      borderRadius: "12px",
                      objectFit: "cover",
                      background: "#faf8f5",
                      marginRight: 24,
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
                    }}
                  />
                  <span
                    style={{
                      fontSize: "25px",
                      fontWeight: 700,
                      color: "#af7928",
                      letterSpacing: "1px",
                    }}
                  >
                    {shopName || "My Shop"}
                  </span>
                </div>

                {/* Order Status Card */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    padding: "24px 32px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 18,
                      color: "#2e3f36",
                      marginBottom: 18,
                    }}
                  >
                    Order Status
                  </div>
                  <div style={{ display: "flex", gap: "32px" }}>
                    {[
                      { label: "To Ship", value: 0, color: "#af7928" },
                      { label: "Cancelled", value: 0, color: "#e74c3c" },
                      { label: "Return", value: 0, color: "#888" },
                      { label: "Review", value: 0, color: "#45956a" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          flex: 1,
                          background: "#faf8f5",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "18px 0",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: stat.color,
                            marginBottom: 4,
                          }}
                        >
                          {stat.value}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            color: "#2e3f36",
                            fontWeight: 500,
                          }}
                        >
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links Card */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    padding: "24px 32px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 18,
                      color: "#2e3f36",
                      marginBottom: 18,
                    }}
                  >
                    Quick Links
                  </div>
                  <div style={{ display: "flex", gap: "32px" }}>
                    {/* My Products */}
                    <div
                      className="quick-link-card"
                      style={{
                        flex: 1,
                        background: "#e74c3c",
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "24px 0",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => (window.location.href = "/product")}
                      tabIndex={0}
                      role="button"
                      aria-label="Go to My Products"
                    >
                      <FaBoxOpen
                        style={{
                          fontSize: 30,
                          color: "#fff",
                          marginBottom: 8,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#fff",
                        }}
                      >
                        My Products
                      </span>
                    </div>
                    {/* Shop Performance */}
                    <div
                      className="quick-link-card"
                      style={{
                        flex: 1,
                        background: "#888",
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "24px 0",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => (window.location.href = "/analytics")}
                      tabIndex={0}
                      role="button"
                      aria-label="Go to Shop Performance"
                    >
                      <FaStore
                        style={{
                          fontSize: 30,
                          color: "#fff",
                          marginBottom: 8,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#fff",
                        }}
                      >
                        Shop Performance
                      </span>
                    </div>
                    {/* FAQ */}
                    <div
                      className="quick-link-card"
                      style={{
                        flex: 1,
                        background: "#45956a",
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "10px 0",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => (window.location.href = "/faq")}
                      tabIndex={0}
                      role="button"
                      aria-label="Go to FAQ"
                    >
                      <span
                        style={{
                          fontSize: 30,
                          color: "#fff",
                          marginBottom: 8,
                        }}
                      >
                        ?
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#fff",
                        }}
                      >
                        FAQ
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    borderRadius: 5,
                    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)",
                    padding: "0.5rem 2rem",
                    display: "flex",
                    alignItems: "center",
                    minHeight: 120,
                    cursor: "pointer",
                    transition: "box-shadow 0.3s ease",
                    position: "relative",
                  }}
                  onClick={() =>
                    (window.location.href = `/artiststory/${encodeURIComponent(
                      fullName
                    )}`)
                  }
                  tabIndex={0}
                  role="button"
                  aria-label="View Artist Story"
                  onMouseEnter={(e) => {
                    const arrow = e.currentTarget.querySelector(
                      ".artist-arrow"
                    ) as HTMLElement | null;
                    if (arrow) arrow.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const arrow = e.currentTarget.querySelector(
                      ".artist-arrow"
                    ) as HTMLElement | null;
                    if (arrow) arrow.style.opacity = "0";
                  }}
                >
                  <img
                    src={
                      document
                        .getElementById("sellerPhotoPreview")
                        ?.getAttribute("src") ||
                      profilePicture ||
                      "/default-profile.jpg"
                    }
                    alt="Artist"
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 5,
                      border: "2px solid #af7928",
                      objectFit: "cover",
                      marginRight: 24,
                      background: "#faf8f5",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#2e3f36",
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sellerStoryTitle || "Artist Story"}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#af7928",
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {fullName}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#222",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 400,
                      }}
                      title={sellerStory}
                    >
                      {sellerStory.length > 80
                        ? sellerStory.slice(0, 80) + "..."
                        : sellerStory || "No story provided yet."}
                    </div>
                  </div>
                  <span
                    className="artist-arrow"
                    style={{
                      fontSize: "2rem",
                      color: "#af7928",
                      marginLeft: 24,
                      flexShrink: 0,
                      opacity: 0,
                      transition: "opacity 0.2s",
                      position: "absolute",
                      right: 32,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <i
                      className="fa-solid fa-chevron-right"
                      style={{ fontSize: "2rem", color: "#af7928" }}
                    ></i>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

// Wishlist Content Component
function WishlistContent() {
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { data: session } = useSession();

  // Load wishlist directly from API
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (!session?.user?.id) {
          // For guest users, load from localStorage
          const saved = localStorage.getItem('wishlist');
          if (saved) {
            const ids = JSON.parse(saved);
            setWishlistIds(ids);
          }
          return;
        }

        setIsLoadingProducts(true);

        // Load wishlist IDs from API
        const response = await fetch('/api/user/wishlist');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // If data.data contains full product objects, extract IDs
          const ids = data.data.map((item: any) => 
            typeof item === 'string' ? item : item._id
          );
          setWishlistIds(ids);
          
          // If we got full product objects, use them directly
          if (data.data.length > 0 && typeof data.data[0] === 'object' && data.data[0]._id) {
            setWishlistProducts(data.data);
            return;
          }
          
          // If we only got IDs, fetch product details
          if (ids.length > 0) {
            const productPromises = ids.map((id: string) =>
              fetch(`/api/products/${id}`).then((res) => res.json()).catch(() => null)
            );

            const results = await Promise.all(productPromises);
            const products = results
              .filter((result) => result && result.success)
              .map((result) => result.data);

            setWishlistProducts(products);
          }
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadWishlist();
  }, [session?.user?.id]); // Only depend on session

  const removeFromWishlist = (productId: string) => {
    // Use the toggleWishlist function from the hook
    toggleWishlist(productId);
    
    // Update local state immediately for better UX
    setWishlistProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  if (isLoadingProducts) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "48px", color: "#AF7928" }}
        ></i>
        <p style={{ marginTop: "20px", color: "#666" }}>
          Loading your wishlist...
        </p>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center" }}>
        <FaHeart
          style={{ fontSize: "64px", color: "#d4a664", marginBottom: "1px" }}
        />
        <h3
          style={{ fontSize: "1.5rem", color: "#2E3F36", marginBottom: "12px" }}
        >
          Your wishlist is empty
        </h3>
        <p style={{ color: "#666", fontSize: "1rem" }}>
          Start adding products you love to your wishlist!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "24px",
        }}
      >
        {wishlistProducts.map((product) => (
          <div
            key={product._id}
            style={{
              background: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={product.images?.[0] || product.thumbnailUrl}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(product._id);
                }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e74c3c";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.95)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FaHeart style={{ color: "#e74c3c", fontSize: "18px" }} />
              </button>
            </div>
            <div style={{ padding: "16px" }}>
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#2E3F36",
                  marginBottom: "8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {product.name}
              </h4>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "12px",
                }}
              >
                {product.artistName}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    color: "#AF7928",
                  }}
                >
                  ₱{product.price?.toFixed(2)}
                </span>
                {product.averageRating > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.85rem",
                      color: "#FFC46B",
                    }}
                  >
                    <i className="fas fa-star"></i>
                    <span>{product.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
