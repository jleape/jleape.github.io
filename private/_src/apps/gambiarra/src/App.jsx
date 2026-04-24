import { useState, createContext, useContext } from "react";
import {
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  FileCheck,
  Hammer,
  Upload,
  Star,
  ArrowLeft,
  Filter,
  Cpu,
  Droplets,
  Sun,
  Refrigerator,
  Lightbulb,
  Package,
  CheckCircle2,
  AlertTriangle,
  Circle,
  ExternalLink,
  Plus,
  Sliders,
  Image as ImageIcon,
  FileText,
  DollarSign,
  HeartHandshake,
  GitPullRequest,
  GitMerge,
  MessageCircle,
  Gift,
  Link2,
  Zap,
  Replace,
  ChevronUp,
  Send,
  Truck,
  UserCheck,
  Download,
  ShoppingBag,
  Briefcase,
  Store,
  Factory,
  Home,
  Award,
  Camera,
  Globe,
  Calendar,
} from "lucide-react";

// ============================================================
// STYLE CONSTANTS
// ============================================================
const COLORS = {
  paper: "#F5EFE2",
  paperDark: "#EBE3D0",
  ink: "#1A1814",
  inkSoft: "#3C372F",
  muted: "#7A7260",
  line: "#C8BDA4",
  clay: "#B5482E",
  clayDark: "#8A3620",
  ochre: "#C9983C",
  ochreDark: "#A07523",
  forest: "#2A4339",
  forestSoft: "#3F5D4F",
  cream: "#FAF6ED",
};

const FONT_DISPLAY = "'Fraunces', 'Georgia', serif";
const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Menlo', monospace";

// ============================================================
// I18N
// ============================================================
const LangContext = createContext({ lang: "pt", region: "Brasil" });
const useL = () => useContext(LangContext);
const CreditsContext = createContext({ credits: 0, setCredits: () => {} });
const useCredits = () => useContext(CreditsContext);
const pick = (v, lang) => {
  if (v && typeof v === "object" && (v.pt !== undefined || v.en !== undefined)) return v[lang] ?? v.pt ?? v.en;
  return v;
};
const tr = (pt, en, lang) => (lang === "en" ? en : pt);

// Given a design's constraints and the current user region, return the most
// relevant warning (or null). We deliberately surface at most ONE warning to
// avoid overwhelming the user with every possible edge case.
const getConstraintWarning = (constraints, region, lang) => {
  if (!constraints) return null;
  const { tempMin, tempMax, humidityMax, coastalRated, seismicRated } = constraints;
  if (region === "Brasil") {
    // Brazil: persistent high humidity (coast, north); heat waves; some coastal salinity
    if (humidityMax != null && humidityMax < 80) {
      return {
        severity: "warning",
        text: tr(
          `Atenção: este projeto funciona melhor com umidade abaixo de ${humidityMax}%. Muitas regiões do Brasil passam de 85%.`,
          `Heads up: this design performs best below ${humidityMax}% humidity. Much of Brazil runs above 85%.`,
          lang
        ),
      };
    }
    if (tempMax != null && tempMax < 40) {
      return {
        severity: "warning",
        text: tr(
          `Atenção: especificado para até ${tempMax}°C. Regiões do Nordeste e interior passam disso com frequência.`,
          `Heads up: rated only up to ${tempMax}°C. Brazil's Northeast and interior regularly exceed this.`,
          lang
        ),
      };
    }
    if (coastalRated === false) {
      return {
        severity: "note",
        text: tr(
          "Nota: não testado para ar marítimo. Componentes metálicos podem corroer em cidades costeiras.",
          "Note: not tested in coastal air. Metal components may corrode in coastal cities.",
          lang
        ),
      };
    }
  } else if (region === "USA") {
    // US: freezing winters across most of the north; coastal salt on both coasts; seismic on West
    if (tempMin != null && tempMin > -10) {
      return {
        severity: "warning",
        text: tr(
          `Atenção: rated only down to ${tempMin}°C. Winters across most of the northern US drop below this — outdoor installations at risk.`,
          `Heads up: rated only down to ${tempMin}°C (${Math.round(tempMin * 9/5 + 32)}°F). Most of the northern US drops below this in winter.`,
          lang
        ),
      };
    }
    if (coastalRated === false) {
      return {
        severity: "note",
        text: tr(
          "Note: not tested in coastal air. Metal parts may corrode along the coasts.",
          "Note: not tested in coastal air. Metal parts may corrode along the coasts.",
          lang
        ),
      };
    }
  }
  return null;
};

// ============================================================
// SYNTHETIC DATA
// ============================================================
const getCategories = (lang) => [
  { id: "all", label: tr("Todos", "All", lang), icon: Package },
  { id: "agua", label: tr("Água", "Water", lang), icon: Droplets },
  { id: "energia", label: tr("Energia", "Energy", lang), icon: Sun },
  { id: "eletro", label: tr("Eletrodomésticos", "Appliances", lang), icon: Refrigerator },
  { id: "luz", label: tr("Iluminação", "Lighting", lang), icon: Lightbulb },
  { id: "habitat", label: tr("Habitat", "Habitat", lang), icon: Home },
  { id: "infra", label: tr("Infraestrutura", "Infrastructure", lang), icon: Factory },
  { id: "moveis", label: tr("Móveis", "Furniture", lang), icon: Hammer },
  { id: "eletronica", label: tr("Eletrônica", "Electronics", lang), icon: Cpu },
];

const DESIGNS = [
  {
    id: "tanquinho-solar",
    name: "Tanquinho Solar",
    nameEn: "Solar Washing Drum",
    designer: "Ana Ribeiro",
    designerLocation: "Recife, PE",
    category: "eletro",
    tier: "Verified",
    license: "CERN-OHL-S v2",
    compensation: "Pay what you want",
    suggestedBRL: 25,
    partsCostBRL: 340,
    partsCostUSD: 68,
    buildHours: 6,
    skillTier: "Intermediário",
    buildCount: 47,
    stars: 4.6,
    reviews: 31,
    tagline: {
      pt: "Máquina de lavar movida a energia solar. Construída com tambor de HDPE e motor reciclado de limpador de para-brisa.",
      en: "Solar-powered washing machine. Built with an HDPE drum and motor salvaged from a windshield wiper.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.ochre,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 5, tempMax: 45, humidityMax: 90, indoorOnly: false, coastalRated: false, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR", "US"] },
  },
  {
    id: "filtro-gravidade",
    name: "Filtro AguaClara Doméstico",
    nameEn: "AguaClara Household Filter",
    designer: "Coletivo Água Viva",
    designerLocation: "Salvador, BA",
    category: "agua",
    tier: "Certified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 180,
    partsCostUSD: 38,
    buildHours: 4,
    skillTier: "Iniciante",
    buildCount: 312,
    stars: 4.9,
    reviews: 208,
    tagline: {
      pt: "Tratamento de água por gravidade. Sem eletricidade. Atende norma NSF-53 e ANVISA RDC 888.",
      en: "Gravity-powered water treatment. No electricity. Meets NSF-53 and ANVISA RDC 888 standards.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forest,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 5, tempMax: 40, humidityMax: 95, indoorOnly: true, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR", "US"], hire: ["BR", "US"] },
    inspiration: { org: "Cornell AguaClara", url: "https://aguaclara.cornell.edu/" },
  },
  {
    id: "ar-condicionado-pvc",
    name: "Refrigerador Evaporativo PVC",
    nameEn: "PVC Evaporative Cooler",
    designer: "Marcos Silva",
    designerLocation: "Teresina, PI",
    category: "eletro",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 95,
    partsCostUSD: 22,
    buildHours: 3,
    skillTier: "Iniciante",
    buildCount: 1240,
    stars: 4.4,
    reviews: 412,
    tagline: {
      pt: "Resfriador por evaporação com canos de PVC. Reduz temperatura ambiente em até 8°C em clima seco.",
      en: "Evaporative cooler built from PVC pipe. Drops room temperature by up to 8°C in dry climates.",
    },
    missionEssential: true,
    parametric: false,
    accent: COLORS.clay,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 20, tempMax: 45, humidityMax: 60, indoorOnly: true, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
  },
  {
    id: "gerador-bicicleta",
    name: "Gerador de Bicicleta",
    nameEn: "Bicycle Power Station",
    designer: "Workshop Libre",
    designerLocation: "São Paulo, SP",
    category: "energia",
    tier: "Verified",
    license: "CERN-OHL-S v2",
    compensation: "Royalty / build",
    suggestedBRL: 8,
    partsCostBRL: 280,
    partsCostUSD: 60,
    buildHours: 5,
    skillTier: "Intermediário",
    buildCount: 89,
    stars: 4.5,
    reviews: 52,
    tagline: {
      pt: "Estação de carregamento USB e 12V movida a pedal. Reaproveita quadro de bicicleta antiga.",
      en: "Pedal-powered USB and 12V charging station. Reuses an old bicycle frame.",
    },
    missionEssential: false,
    parametric: false,
    accent: COLORS.forest,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 0, tempMax: 45, humidityMax: 85, indoorOnly: true, coastalRated: false, seismicRated: null },
    availability: { kit: ["BR", "US"], hire: ["BR", "US"] },
  },
  {
    id: "luz-led-12v",
    name: "Kit Iluminação 12V",
    nameEn: "12V Off-Grid Lighting Kit",
    designer: "Pedro Nazário",
    designerLocation: "Belém, PA",
    category: "luz",
    tier: "Verified",
    license: "CERN-OHL-W v2",
    compensation: "Pay what you want",
    suggestedBRL: 10,
    partsCostBRL: 145,
    partsCostUSD: 32,
    buildHours: 2,
    skillTier: "Iniciante",
    buildCount: 623,
    stars: 4.7,
    reviews: 298,
    tagline: {
      pt: "Kit de iluminação LED 12V para 4 cômodos. Alimentado por painel solar pequeno. Sem eletricista necessário.",
      en: "12V LED lighting kit for 4 rooms. Powered by a small solar panel. No electrician required.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.ochre,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: -10, tempMax: 50, humidityMax: 95, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR", "US"], hire: ["BR", "US"] },
  },
  {
    id: "mesa-concreto",
    name: "Mesa Paramétrica",
    nameEn: "Parametric Concrete Table",
    designer: "Estúdio Rebar",
    designerLocation: "Brooklyn, NY",
    category: "moveis",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Fixed — US$12",
    suggestedBRL: 60,
    partsCostBRL: 220,
    partsCostUSD: 48,
    buildHours: 8,
    skillTier: "Intermediário",
    buildCount: 156,
    stars: 4.3,
    reviews: 78,
    tagline: {
      pt: "Mesa de concreto e vergalhão. Forma de madeira reutilizável. Dimensões ajustáveis conforme espaço.",
      en: "Concrete and rebar table. Reusable wooden formwork. Dimensions adjust to your space.",
    },
    missionEssential: false,
    parametric: true,
    accent: COLORS.muted,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: -30, tempMax: 60, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: "moderate" },
    availability: { kit: [], hire: ["BR", "US"] },
  },
  {
    id: "moinho-bike",
    name: "Moinho de Pedal",
    nameEn: "Pedal Grain Mill",
    designer: "Oficina do Sertão",
    designerLocation: "Petrolina, PE",
    category: "eletro",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 195,
    partsCostUSD: 42,
    buildHours: 7,
    skillTier: "Intermediário",
    buildCount: 73,
    stars: 4.2,
    reviews: 41,
    tagline: {
      pt: "Moinho de grãos movido a pedal. Usa peças de bicicleta velha. Processa 2 kg/h de milho.",
      en: "Pedal-powered grain mill. Built from old bicycle parts. Processes 2 kg/h of corn.",
    },
    missionEssential: true,
    parametric: false,
    accent: COLORS.clay,
    requirements: { certification: [], equipment: ["welding"] },
    constraints: { tempMin: 0, tempMax: 50, humidityMax: 90, indoorOnly: true, coastalRated: false, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
  },
  {
    id: "capta-chuva",
    name: "Captação de Chuva",
    nameEn: "Rooftop Rainwater System",
    designer: "Rede Cisterna",
    designerLocation: "Fortaleza, CE",
    category: "agua",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 420,
    partsCostUSD: 88,
    buildHours: 10,
    skillTier: "Intermediário",
    buildCount: 198,
    stars: 4.8,
    reviews: 124,
    tagline: {
      pt: "Sistema de captação de água da chuva para laje ou telhado. Primeira água descartada automaticamente.",
      en: "Rooftop rainwater harvesting system. First-flush diverter automatically discards initial runoff.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forest,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 0, tempMax: 50, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR", "US"] },
  },
  // ============ GVCS & Design for the Other 90% ============
  {
    id: "prensa-ceb",
    name: "Prensa CEB — Tijolos de Solo",
    nameEn: "CEB Press — Soil Bricks",
    designer: "Open Source Ecology",
    designerLocation: "Maysville, MO",
    category: "habitat",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 3800,
    partsCostUSD: 780,
    buildHours: 40,
    skillTier: "Avançado",
    buildCount: 28,
    stars: 4.7,
    reviews: 19,
    tagline: {
      pt: "Prensa hidráulica que transforma solo do próprio terreno em tijolos estruturais. Fundação de uma casa inteira, sem forno, sem cimento industrial.",
      en: "Hydraulic press that turns soil from your own land into structural bricks. Foundation for a whole house — no kiln, no industrial cement.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.clay,
    requirements: { certification: [], equipment: ["welding"] },
    constraints: { tempMin: -15, tempMax: 50, humidityMax: 95, indoorOnly: false, coastalRated: true, seismicRated: "moderate" },
    availability: { kit: [], hire: ["US"] },
    inspiration: { org: "GVCS — The Liberator", url: "https://www.opensourceecology.org/gvcs/" },
  },
  {
    id: "bomba-pedal",
    name: "Bomba de Pedal de Bambu",
    nameEn: "Bamboo Treadle Pump",
    designer: "IDE / Coletivo Bambu",
    designerLocation: "Porto Alegre, RS",
    category: "agua",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 165,
    partsCostUSD: 35,
    buildHours: 6,
    skillTier: "Intermediário",
    buildCount: 412,
    stars: 4.8,
    reviews: 186,
    tagline: {
      pt: "Bomba de água movida pelo próprio peso do corpo. Estrutura de bambu, dois cilindros de PVC. Tira água de poço raso, irriga plantação na seca.",
      en: "Water pump powered by your own body weight. Bamboo frame, two PVC cylinders. Pulls water from shallow wells, irrigates fields in the dry season.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forestSoft,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 0, tempMax: 45, humidityMax: 100, indoorOnly: false, coastalRated: false, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
    inspiration: { org: "Design for the Other 90% — Bangladesh", url: "http://archive.cooperhewitt.org/other90/other90.cooperhewitt.org/Design/bamboo-treadle-pump.html" },
  },
  {
    id: "fogao-rocket",
    name: "Fogão Rocket",
    nameEn: "Rocket Stove",
    designer: "Aprovecho Research Center",
    designerLocation: "Cottage Grove, OR",
    category: "eletro",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 85,
    partsCostUSD: 28,
    buildHours: 3,
    skillTier: "Iniciante",
    buildCount: 1847,
    stars: 4.9,
    reviews: 623,
    tagline: {
      pt: "Fogão a lenha de alta eficiência. Usa 70% menos madeira que fogão tradicional. Quase sem fumaça. Construído com latas de tinta ou tijolos refratários.",
      en: "High-efficiency wood stove. Uses 70% less wood than a traditional fire. Almost no smoke. Built from paint cans or firebricks.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.ochre,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: -20, tempMax: 60, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR", "US"], hire: ["BR", "US"] },
    inspiration: { org: "Aprovecho Research Center", url: "https://aprovecho.org/" },
  },
  {
    id: "zeer-pot",
    name: "Pote-em-Pote (Zeer)",
    nameEn: "Zeer Pot Refrigerator",
    designer: "Mohammed Bah Abba",
    designerLocation: "Nigéria",
    category: "eletro",
    tier: "Verified",
    license: "Public domain",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 65,
    partsCostUSD: 19,
    buildHours: 1,
    skillTier: "Iniciante",
    buildCount: 2938,
    stars: 4.7,
    reviews: 892,
    tagline: {
      pt: "Refrigerador sem eletricidade. Dois potes de barro, areia molhada no meio. Mantém vegetais frescos por 3 semanas. Tecnologia de 3000 anos reinventada.",
      en: "Electricity-free refrigerator. Two clay pots, wet sand between them. Keeps vegetables fresh for 3 weeks. 3000-year-old tech, reinvented.",
    },
    missionEssential: true,
    parametric: false,
    accent: COLORS.clay,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 15, tempMax: 45, humidityMax: 60, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
    inspiration: { org: "Design for the Other 90% — Nigeria", url: "http://archive.cooperhewitt.org/other90/" },
  },
  {
    id: "q-drum",
    name: "Q-Drum — Água Rolante",
    nameEn: "Q-Drum Rolling Water",
    designer: "Pieter & Hans Hendrikse",
    designerLocation: "África do Sul",
    category: "agua",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Pay what you want",
    suggestedBRL: 5,
    partsCostBRL: 120,
    partsCostUSD: 28,
    buildHours: 4,
    skillTier: "Intermediário",
    buildCount: 87,
    stars: 4.5,
    reviews: 54,
    tagline: {
      pt: "Container cilíndrico de 50L com corda no eixo — rola no chão em vez de carregar na cabeça. Economiza horas por dia para quem busca água longe de casa.",
      en: "50L cylindrical container with rope through the axle — rolls on the ground instead of riding on your head. Saves hours a day when water is far from home.",
    },
    missionEssential: true,
    parametric: false,
    accent: COLORS.forest,
    requirements: { certification: [], equipment: ["molding"] },
    constraints: { tempMin: -10, tempMax: 55, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: [], hire: [] },
    inspiration: { org: "Design for the Other 90% — South Africa", url: "http://archive.cooperhewitt.org/other90/other90.cooperhewitt.org/Design/q-drum.html" },
  },
  // ============ INFRASTRUCTURE — community scale ============
  {
    id: "bicicletario-modular",
    name: "Bicicletário Modular",
    nameEn: "Modular Bike Rack",
    designer: "Coletivo Ciclovida",
    designerLocation: "Curitiba, PR",
    category: "infra",
    scale: "community",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 280,
    partsCostUSD: 62,
    buildHours: 6,
    skillTier: "Iniciante",
    buildCount: 89,
    stars: 4.4,
    reviews: 48,
    tagline: {
      pt: "Bicicletário para 6 bikes em módulo. Aço galvanizado ou madeira tratada. Parafusa no piso ou fica livre com base de concreto.",
      en: "6-bike rack module. Galvanized steel or treated wood. Bolts to pavement or free-standing with concrete base.",
    },
    missionEssential: false,
    parametric: true,
    accent: COLORS.forestSoft,
    requirements: { certification: [], equipment: ["welding"] },
    constraints: { tempMin: -20, tempMax: 60, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: "low" },
    availability: { kit: ["BR"], hire: ["BR"] },
  },
  {
    id: "eta-comunitaria",
    name: "ETA Comunitária AguaClara",
    nameEn: "Community Water Treatment Plant",
    designer: "AguaClara Reach",
    designerLocation: "Ithaca, NY / Honduras",
    category: "infra",
    scale: "community",
    tier: "Certified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 85000,
    partsCostUSD: 18000,
    buildHours: 800,
    skillTier: "Avançado",
    buildCount: 19,
    stars: 4.9,
    reviews: 14,
    tagline: {
      pt: "Estação de tratamento de água para comunidades de 500-10.000 pessoas. Totalmente por gravidade. Sem bombas, sem eletricidade. Já atende 80k+ pessoas em Honduras.",
      en: "Water treatment plant for communities of 500–10,000 people. Fully gravity-driven. No pumps, no electricity. Already serves 80k+ people in Honduras.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forest,
    requirements: { certification: ["civil-engineer"], equipment: ["welding", "concrete"] },
    constraints: { tempMin: 5, tempMax: 40, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: "moderate" },
    availability: { kit: [], hire: [] },
    inspiration: { org: "AguaClara Reach — Cornell", url: "https://www.aguaclarareach.org/" },
  },
  {
    id: "composteira-comunitaria",
    name: "Composteira Comunitária",
    nameEn: "Community Composter",
    designer: "Rede Composta",
    designerLocation: "São Paulo, SP",
    category: "infra",
    scale: "community",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 1800,
    partsCostUSD: 380,
    buildHours: 24,
    skillTier: "Intermediário",
    buildCount: 143,
    stars: 4.7,
    reviews: 91,
    tagline: {
      pt: "Sistema de 3 compartimentos para processar resíduos orgânicos de 40-80 famílias. Revestimento de madeira tratada. Saída de composto e chorume.",
      en: "Three-bin system for processing organic waste from 40–80 households. Treated-wood cladding. Compost and leachate outputs.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forestSoft,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: 5, tempMax: 45, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
  },
  {
    id: "muro-gabiao",
    name: "Muro de Gabião Anti-Erosão",
    nameEn: "Gabion Retaining Wall",
    designer: "Engenharia Popular USP",
    designerLocation: "São Paulo, SP",
    category: "infra",
    scale: "community",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 320,
    partsCostUSD: 72,
    buildHours: 12,
    skillTier: "Intermediário",
    buildCount: 67,
    stars: 4.6,
    reviews: 38,
    tagline: {
      pt: "Muro de contenção por gabiões (cestos de aço preenchidos com pedra). Adaptação climática para encostas em risco de deslizamento em chuvas intensas. R$/m³.",
      en: "Retaining wall from gabion baskets (wire cages filled with rock). Climate adaptation for slopes at landslide risk during heavy rains. Priced per m³.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.clay,
    requirements: { certification: [], equipment: [] },
    constraints: { tempMin: -20, tempMax: 60, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: "high" },
    availability: { kit: [], hire: ["BR"] },
  },
  {
    id: "barreira-enchente",
    name: "Barreira Modular de Enchente",
    nameEn: "Modular Flood Barrier",
    designer: "Resposta Rápida / Open Flood",
    designerLocation: "Blumenau, SC",
    category: "infra",
    scale: "community",
    tier: "Verified",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 180,
    partsCostUSD: 42,
    buildHours: 2,
    skillTier: "Iniciante",
    buildCount: 312,
    stars: 4.8,
    reviews: 147,
    tagline: {
      pt: "Módulo de barreira de 1m preenchido com água local para bloquear enchente. Encaixa em cadeia; protege até 80cm de coluna d'água. Pós-emergência: esvazia e guarda.",
      en: "1m barrier module filled with local water to block floodwaters. Interlocks in a chain; holds back up to 80cm of water. After emergency: drain and store.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.forest,
    requirements: { certification: [], equipment: ["molding"] },
    constraints: { tempMin: 0, tempMax: 50, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: null },
    availability: { kit: ["BR"], hire: ["BR"] },
  },
  {
    id: "pergolado-sombra",
    name: "Pergolado de Sombra para Praça",
    nameEn: "Shade Pergola for Public Square",
    designer: "Cidade Fresca",
    designerLocation: "Fortaleza, CE",
    category: "infra",
    scale: "community",
    tier: "Open",
    license: "CC-BY-SA 4.0",
    compensation: "Grátis",
    suggestedBRL: 0,
    partsCostBRL: 2400,
    partsCostUSD: 520,
    buildHours: 32,
    skillTier: "Intermediário",
    buildCount: 24,
    stars: 4.5,
    reviews: 16,
    tagline: {
      pt: "Estrutura de sombreamento 6×6m para redução de ilha de calor urbana. Madeira ou aço com tela shading 70%. Pode integrar plantas trepadeiras.",
      en: "6×6m shading structure to mitigate urban heat island. Wood or steel frame with 70% shade cloth. Can integrate climbing plants.",
    },
    missionEssential: true,
    parametric: true,
    accent: COLORS.ochre,
    requirements: { certification: [], equipment: ["welding"] },
    constraints: { tempMin: -15, tempMax: 55, humidityMax: 100, indoorOnly: false, coastalRated: true, seismicRated: "moderate" },
    availability: { kit: [], hire: ["BR"] },
  },
];

const BOM_TANQUINHO = [
  {
    desc: { pt: "Tambor plástico HDPE 120L com tampa", en: "120L HDPE plastic drum with lid" },
    qty: 1,
    unit: "un",
    alts: [
      { label: { pt: "Tambor HDPE 100–150L (qualquer fornecedor)", en: "100–150L HDPE drum (any supplier)" }, savings: "R$ 0–40" },
      { label: { pt: "Tambor de aço inox reaproveitado (laticínio)", en: "Reused stainless drum (dairy)" }, savings: "R$ 85" },
      { label: { pt: "Bombona de 100L reutilizada", en: "Reused 100L jerrycan" }, savings: "R$ 70" },
    ],
    br: { supplier: "Casa & Construção", price: 85, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 28, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Motor DC 12V 200W com redutor", en: "12V 200W DC motor with gearbox" },
    qty: 1,
    unit: "un",
    part: "MY1016Z2",
    alts: [
      { label: { pt: "Motor de limpador de para-brisa (sucata auto)", en: "Windshield wiper motor (auto salvage)" }, savings: "R$ 130" },
      { label: { pt: "Motor de máquina de lavar descartada (ver PR #2)", en: "Motor from discarded washing machine (see PR #2)" }, savings: "R$ 180" },
      { label: { pt: "Motor DC 24V 150W com step-down", en: "24V 150W DC motor with step-down" }, savings: "R$ 20" },
    ],
    br: { supplier: "Mercado Livre", price: 180, stock: { pt: "5+ vendedores", en: "5+ sellers" } },
    us: { supplier: "Mouser", price: 42, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Painel solar 100W monocristalino", en: "100W monocrystalline solar panel" },
    qty: 1,
    unit: "un",
    alts: [
      { label: { pt: "Painel solar 80–120W (qualquer marca)", en: "80–120W solar panel (any brand)" }, savings: "R$ 0–50" },
      { label: { pt: "2× painéis 50W em paralelo", en: "2× 50W panels in parallel" }, savings: "−R$ 20" },
    ],
    br: { supplier: "Neosolar", price: 420, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Renogy (Amazon)", price: 95, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Controlador de carga PWM 12V 15A", en: "PWM charge controller 12V 15A" },
    qty: 1,
    unit: "un",
    alts: [
      { label: { pt: "MPPT 10A (mais eficiente, mais caro)", en: "MPPT 10A (more efficient, more expensive)" }, savings: "−R$ 120" },
    ],
    br: { supplier: "Mercado Livre", price: 68, stock: { pt: "10+ vendedores", en: "10+ sellers" } },
    us: { supplier: "Mouser", price: 22, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Bateria 12V 35Ah (opcional)", en: "12V 35Ah battery (optional)" },
    qty: 1,
    unit: "un",
    alts: [
      { label: { pt: "Bateria automotiva usada testada", en: "Tested used car battery" }, savings: "R$ 180" },
    ],
    br: { supplier: "Moura", price: 280, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "AutoZone", price: 72, stock: { pt: "Retirada local", en: "Local pickup" } },
    critical: false,
  },
  {
    desc: { pt: "Cano PVC 40mm x 1m", en: "40mm PVC pipe x 1m" },
    qty: 2,
    unit: "un",
    alts: [
      { label: { pt: "Cano PVC 50mm (adaptar com redução)", en: "50mm PVC pipe (adapt with reducer)" }, savings: "R$ 0" },
    ],
    br: { supplier: "Tigre (Leroy Merlin)", price: 14, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 5, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Parafusos M6 x 25mm inox", en: "M6 × 25mm stainless bolts" },
    qty: 12,
    unit: "un",
    alts: [
      { label: { pt: "Parafusos M5 x 25mm (alterar furação, ver PR #4)", en: "M5 × 25mm bolts (change drill, see PR #4)" }, savings: "R$ 3" },
    ],
    br: { supplier: "Ciser", price: 0.8, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "McMaster-Carr", price: 0.2, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Fio flexível 2,5mm² (par)", en: "2.5mm² flexible wire (pair)" },
    qty: 3,
    unit: "m",
    alts: [],
    br: { supplier: "Leroy Merlin", price: 4.5, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 1.1, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
];

// Zeer Pot BOM — intentionally simple: two pots, sand, cloth, water
const BOM_ZEER = [
  {
    desc: { pt: "Pote de barro (externo) Ø 40cm, não vitrificado", en: "Unglazed terracotta pot (outer), Ø 40cm" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Pote Ø 35–45cm (qualquer loja de jardim)", en: "Ø 35–45cm pot (any garden store)" }, savings: "R$ 0" },
      { label: { pt: "Pote de barro reaproveitado com rachaduras seladas", en: "Salvaged pot with sealed cracks" }, savings: "R$ 15" },
    ],
    br: { supplier: "Casa & Jardim", price: 28, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 8, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Pote de barro (interno) Ø 30cm, não vitrificado", en: "Unglazed terracotta pot (inner), Ø 30cm" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Pote Ø 25–35cm", en: "Ø 25–35cm pot" }, savings: "R$ 0" },
    ],
    br: { supplier: "Casa & Jardim", price: 18, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 5, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Areia fina, lavada (5kg)", en: "Fine washed sand (5kg)" },
    qty: 1, unit: "sc",
    alts: [
      { label: { pt: "Areia de construção peneirada", en: "Sifted construction sand" }, savings: "R$ 5" },
    ],
    br: { supplier: "Depósito local", price: 8, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 3, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Pano de algodão úmido para tampa", en: "Damp cotton cloth for cover" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Pano de prato velho, limpo", en: "Old clean tea towel" }, savings: "R$ 8" },
    ],
    br: { supplier: "Qualquer", price: 8, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Any", price: 2, stock: { pt: "Em estoque", en: "In stock" } },
    critical: false,
  },
  {
    desc: { pt: "Rolha de silicone para furo de drenagem (opcional)", en: "Silicone plug for drainage hole (optional)" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Vedação com cimento ou argila", en: "Seal with cement or clay" }, savings: "R$ 3" },
    ],
    br: { supplier: "Ferragem local", price: 3, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Any hardware", price: 1, stock: { pt: "Em estoque", en: "In stock" } },
    critical: false,
  },
];

// Rocket Stove BOM — metal can body + insulating riser
const BOM_ROCKET = [
  {
    desc: { pt: "Lata de tinta vazia 20L (corpo)", en: "Empty 20L paint can (body)" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Tambor metálico 20L reutilizado", en: "Reused 20L metal drum" }, savings: "R$ 15" },
      { label: { pt: "Construção em tijolo refratário", en: "Firebrick construction" }, savings: "−R$ 40" },
    ],
    br: { supplier: "Loja tintas", price: 20, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 8, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Cano de metal galvanizado Ø 10cm × 40cm (chaminé interna)", en: "Galvanized steel pipe Ø 10cm × 40cm (riser)" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Chaminé de fogão antiga", en: "Old stovepipe section" }, savings: "R$ 10" },
    ],
    br: { supplier: "Ferragem local", price: 25, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 7, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Cano de metal Ø 10cm × 15cm (alimentação)", en: "Metal pipe Ø 10cm × 15cm (feed tube)" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Conexão T de aço", en: "Steel T-fitting" }, savings: "R$ 0" },
    ],
    br: { supplier: "Ferragem local", price: 15, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 5, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Cinzas de madeira ou vermiculita (isolamento)", en: "Wood ash or vermiculite (insulation)" },
    qty: 1, unit: "sc",
    alts: [
      { label: { pt: "Cinzas da própria queima (grátis)", en: "Ash from your own fire (free)" }, savings: "R$ 12" },
    ],
    br: { supplier: "Jardinagem", price: 12, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Garden center", price: 4, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
  {
    desc: { pt: "Grade de aço para suporte de panela Ø 18cm", en: "Steel grate for pot support Ø 18cm" },
    qty: 1, unit: "un",
    alts: [
      { label: { pt: "Barras de ferro soldadas em cruz", en: "Welded rebar cross" }, savings: "−R$ 5" },
    ],
    br: { supplier: "Ferragem local", price: 13, stock: { pt: "Em estoque", en: "In stock" } },
    us: { supplier: "Home Depot", price: 4, stock: { pt: "Em estoque", en: "In stock" } },
    critical: true,
  },
];

// Registry: designId → BOM. Lookup fallback handles designs that don't yet have their own.
const BOMS_BY_DESIGN = {
  "tanquinho-solar": BOM_TANQUINHO,
  "zeer-pot": BOM_ZEER,
  "fogao-rocket": BOM_ROCKET,
};
const getBOM = (designId) => BOMS_BY_DESIGN[designId] || null;

const BUILDS = [
  {
    id: "b1",
    designId: "tanquinho-solar",
    designName: { pt: "Tanquinho Solar", en: "Solar Washing Drum" },
    maker: "Luzia M.",
    location: "Caruaru, PE",
    daysAgo: 3,
    actualCostBRL: 298,
    actualHours: 7.5,
    note: {
      pt: "Funcionou de primeira! Adaptei o tambor de 100L que tinha em casa.",
      en: "Worked first try! Adapted the 100L drum I had at home.",
    },
    substitutions: [
      {
        original: { pt: "Tambor HDPE 120L", en: "120L HDPE drum" },
        replaced: { pt: "Tambor HDPE 100L reaproveitado", en: "Salvaged 100L HDPE drum" },
        reason: { pt: "Já tinha em casa; reduziu custo em R$ 85", en: "Already had it; saved R$ 85" },
      },
    ],
    workarounds: [
      {
        step: { pt: "Etapa 3 · Instalar transmissão", en: "Step 3 · Install transmission" },
        issue: { pt: "Polia do tamanho especificado indisponível na cidade", en: "Specified pulley size unavailable in town" },
        fix: { pt: "Torneei polia em marcenaria local (+2h, +R$ 30)", en: "Machined pulley at local woodshop (+2h, +R$ 30)" },
      },
    ],
    accent: COLORS.ochre,
    giftedBy: null,
  },
  {
    id: "b2",
    designId: "filtro-gravidade",
    designName: { pt: "Filtro AguaClara", en: "AguaClara Filter" },
    maker: "Escola Rural Boa Vista",
    location: "Juazeiro, BA",
    daysAgo: 7,
    actualCostBRL: 520,
    actualHours: 11,
    note: {
      pt: "Instalamos 3 unidades para 80 alunos. Turbidez reduzida de 12 NTU para <0.5.",
      en: "Installed 3 units for 80 students. Turbidity reduced from 12 NTU to <0.5.",
    },
    substitutions: [],
    workarounds: [],
    accent: COLORS.forest,
    giftedBy: "Marcos Andrade (SP)",
  },
  {
    id: "b3",
    designId: "ar-condicionado-pvc",
    designName: { pt: "Refrigerador Evaporativo", en: "Evaporative Cooler" },
    maker: "João P.",
    location: "Mossoró, RN",
    daysAgo: 1,
    actualCostBRL: 87,
    actualHours: 2.5,
    note: {
      pt: "Custou R$ 87 no total. Reduziu a sala de 34°C para 27°C em 20 minutos.",
      en: "Cost R$ 87 total. Cooled the room from 34°C to 27°C in 20 minutes.",
    },
    substitutions: [
      {
        original: { pt: "Ventilador 120mm novo", en: "New 120mm fan" },
        replaced: { pt: "Ventilador reaproveitado de PC antigo", en: "Fan salvaged from old PC" },
        reason: { pt: "Grátis; mesma vazão", en: "Free; same airflow" },
      },
    ],
    workarounds: [],
    accent: COLORS.clay,
    giftedBy: null,
  },
  {
    id: "b4",
    designId: "gerador-bicicleta",
    designName: { pt: "Gerador de Bicicleta", en: "Bicycle Generator" },
    maker: "Makerspace Vila Madalena",
    location: "São Paulo, SP",
    daysAgo: 12,
    actualCostBRL: 310,
    actualHours: 6,
    note: {
      pt: "Usamos com aulas de 3a e 4a série. As crianças adoraram. Adicionamos visor LCD para eles verem a voltagem.",
      en: "Used it with 3rd and 4th grade classes. The kids loved it. Added an LCD so they could see voltage.",
    },
    substitutions: [],
    workarounds: [
      {
        step: { pt: "Etapa 2 · Montar suporte", en: "Step 2 · Build support" },
        issue: { pt: "Quadro de bike que tínhamos era alumínio (não ferro)", en: "The bike frame we had was aluminum (not steel)" },
        fix: { pt: "Usamos parafusos + porcas em vez de solda", en: "Used bolts + nuts instead of welding" },
      },
    ],
    accent: COLORS.forest,
    giftedBy: null,
  },
  {
    id: "b5",
    designId: "luz-led-12v",
    designName: { pt: "Kit Iluminação 12V", en: "12V Lighting Kit" },
    maker: "Dona Teresa",
    location: "Manaus, AM",
    daysAgo: 5,
    actualCostBRL: 145,
    actualHours: 2,
    note: {
      pt: "Primeira vez que tenho luz à noite sem depender do gerador do vizinho. Muito obrigada Pedro!",
      en: "First time I have light at night without depending on my neighbor's generator. Thank you Pedro!",
    },
    substitutions: [],
    workarounds: [],
    accent: COLORS.ochre,
    giftedBy: "Pedro Costa (RJ)",
  },
  {
    id: "b6",
    designId: "capta-chuva",
    designName: { pt: "Captação de Chuva", en: "Rainwater Catchment" },
    maker: "Coletivo Serra Verde",
    location: "Fortaleza, CE",
    daysAgo: 20,
    actualCostBRL: 445,
    actualHours: 12,
    note: {
      pt: "Capacidade de 2000L. Já enchemos 2x no último mês.",
      en: "2000L capacity. Already filled it twice this past month.",
    },
    substitutions: [
      {
        original: { pt: "Tela plástica filtro", en: "Plastic filter screen" },
        replaced: { pt: "Tela inox (reaproveitada)", en: "Stainless screen (salvaged)" },
        reason: { pt: "Mais durável contra raios UV", en: "More UV-resistant" },
      },
    ],
    workarounds: [],
    accent: COLORS.forest,
    giftedBy: null,
  },
];

const REQUESTS = [
  {
    id: "r1",
    title: { pt: "Incubadora neonatal para posto de saúde rural", en: "Neonatal incubator for rural health clinic" },
    requester: "Dra. Helena Moura",
    requesterType: { pt: "Profissional de saúde", en: "Health professional" },
    location: "Marabá, PA",
    daysAgo: 6,
    description: {
      pt: "Hospital municipal precisa de incubadoras baratas e de fácil manutenção. Unidades comerciais custam R$ 30k+ e ficam paradas aguardando peças importadas.",
      en: "Municipal hospital needs cheap, easy-to-maintain incubators. Commercial units cost R$ 30k+ and sit idle waiting for imported parts.",
    },
    specs: {
      pt: [
        "Temperatura controlada 32–37°C ±0.5°C",
        "Umidade 40–60%, com alarme",
        "Funciona a bateria 12V por ≥4h em queda de luz",
        "Peças de reposição com fornecedores em 48h",
      ],
      en: [
        "Controlled temperature 32–37°C ±0.5°C",
        "Humidity 40–60%, with alarm",
        "Runs on 12V battery for ≥4h during outages",
        "Replacement parts available from suppliers in 48h",
      ],
    },
    budgetBRL: 3500,
    referenceUrl: "https://www.openmedicaldevices.org/incubator",
    referenceNote: {
      pt: "Design existente, mas sem BOM estruturado nem alternativas regionais",
      en: "Existing design, but lacks structured BOM and regional alternatives",
    },
    upvotes: 312,
    preorderCount: 14,
    preorderTotalBRL: 2800,
    status: "open",
    category: { pt: "Saúde", en: "Health" },
  },
  {
    id: "r2",
    title: { pt: "Geladeira solar para vacinas (80L)", en: "Solar vaccine refrigerator (80L)" },
    requester: "Associação Kalunga",
    requesterType: { pt: "Comunidade", en: "Community" },
    location: "Cavalcante, GO",
    daysAgo: 14,
    description: {
      pt: "Campanha de vacinação atende 6 comunidades quilombolas sem rede elétrica estável. Precisamos manter vacinas em 2–8°C por até 12h sem sol.",
      en: "Vaccination campaign serves 6 quilombola communities without reliable grid power. We need to keep vaccines at 2–8°C for up to 12h without sun.",
    },
    specs: {
      pt: [
        "Volume útil 80L, temperatura 2–8°C",
        "Compressor 12V DC (não peltier)",
        "Autonomia 12h sem insolação",
        "Registro de temperatura exportável",
      ],
      en: [
        "Usable volume 80L, temperature 2–8°C",
        "12V DC compressor (not peltier)",
        "12h autonomy without sun",
        "Exportable temperature log",
      ],
    },
    budgetBRL: 2800,
    referenceUrl: null,
    referenceNote: null,
    upvotes: 187,
    preorderCount: 8,
    preorderTotalBRL: 1200,
    status: "in_progress",
    assignedTo: "Laboratório Aberto UFG",
    category: { pt: "Saúde", en: "Health" },
  },
  {
    id: "r3",
    title: { pt: "Forno de biomassa eficiente para merenda escolar", en: "Efficient biomass stove for school meals" },
    requester: "Escola Municipal São Francisco",
    requesterType: { pt: "Escola", en: "School" },
    location: "Sobral, CE",
    daysAgo: 22,
    description: {
      pt: "Cozinhamos para 120 alunos/dia. Forno a lenha atual consome muita madeira. Precisa reduzir consumo e fumaça.",
      en: "We cook for 120 students/day. Current wood stove uses too much firewood. Needs to reduce consumption and smoke.",
    },
    specs: {
      pt: [
        "Capacidade para 3 panelas de 20L simultâneas",
        "Redução de ≥50% no consumo de lenha vs fogão tradicional",
        "Chaminé com exaustão adequada",
      ],
      en: [
        "Capacity for 3 simultaneous 20L pots",
        "≥50% reduction in firewood use vs traditional stove",
        "Chimney with adequate draft",
      ],
    },
    budgetBRL: 1200,
    referenceUrl: "https://www.aprovecho.org/rocket-stove",
    referenceNote: {
      pt: "Adaptar design 'rocket stove' para escala institucional brasileira",
      en: "Adapt 'rocket stove' design for Brazilian institutional scale",
    },
    upvotes: 94,
    preorderCount: 3,
    preorderTotalBRL: 480,
    status: "open",
    category: { pt: "Alimentação", en: "Food" },
  },
  {
    id: "r4",
    title: { pt: "Máquina de costura a pedal melhorada", en: "Improved treadle sewing machine" },
    requester: "Cooperativa Costura Livre",
    requesterType: { pt: "Cooperativa", en: "Cooperative" },
    location: "Recife, PE",
    daysAgo: 4,
    description: {
      pt: "15 costureiras produzem uniformes. Máquinas elétricas quebram e oficina não tem 3F. Queremos voltar para pedal mas com melhorias ergonômicas.",
      en: "15 seamstresses make uniforms. Electric machines break and our workshop has no 3-phase. We want to go back to treadle but with ergonomic improvements.",
    },
    specs: {
      pt: [
        "Cabeça de máquina industrial reaproveitada",
        "Mesa ajustável em altura",
        "Transmissão por correia com tensionador",
        "Banco com apoio lombar integrado",
      ],
      en: [
        "Reused industrial machine head",
        "Height-adjustable table",
        "Belt drive with tensioner",
        "Stool with integrated lumbar support",
      ],
    },
    budgetBRL: 800,
    referenceUrl: null,
    referenceNote: null,
    upvotes: 156,
    preorderCount: 22,
    preorderTotalBRL: 3300,
    status: "open",
    category: { pt: "Trabalho", en: "Work" },
  },
  {
    id: "r5",
    title: { pt: "Moinho d'água para pequena propriedade", en: "Water mill for small farm" },
    requester: "Seu Raimundo",
    requesterType: { pt: "Agricultor", en: "Farmer" },
    location: "Diamantina, MG",
    daysAgo: 31,
    description: {
      pt: "Tenho córrego no fundo do sítio. Quero moer milho e gerar um pouco de luz. Vi um design no Hackaday mas não entendi os cálculos.",
      en: "I have a stream on my property. I want to grind corn and generate a bit of electricity. I saw a design on Hackaday but couldn't follow the calculations.",
    },
    specs: {
      pt: [
        "Queda de 2,5m, vazão ~8 L/s disponível",
        "Roda d'água de madeira (tenho eucalipto)",
        "Saída: moer 3 kg/h milho OU gerar 100W",
      ],
      en: [
        "2.5m head, ~8 L/s flow available",
        "Wooden water wheel (I have eucalyptus)",
        "Output: grind 3 kg/h corn OR generate 100W",
      ],
    },
    budgetBRL: 900,
    referenceUrl: "https://hackaday.io/project/19747-water-wheel",
    referenceNote: {
      pt: "Gostaria de formalizar esse projeto — BOM em PT, cálculos verificados",
      en: "Would like this design formalized — BOM in PT, verified calculations",
    },
    upvotes: 73,
    preorderCount: 5,
    preorderTotalBRL: 750,
    status: "open",
    category: { pt: "Energia", en: "Energy" },
  },
  {
    id: "r6",
    title: { pt: "Bicicleta de carga elétrica (cargo e-bike)", en: "Electric cargo bike" },
    requester: "Entregadores da Leste SP",
    requesterType: { pt: "Coletivo", en: "Collective" },
    location: "São Paulo, SP",
    daysAgo: 9,
    description: {
      pt: "Somos 40 entregadores. Queremos alternativa à moto — mais barata, sem seguro obrigatório, sem gasolina.",
      en: "We're 40 delivery workers. We want an alternative to motorcycles — cheaper, no mandatory insurance, no gas.",
    },
    specs: {
      pt: [
        "Capacidade de carga 80kg",
        "Autonomia 40km com uma recarga",
        "Baterias removíveis e padronizadas",
        "Design compatível com quadros brasileiros disponíveis",
      ],
      en: [
        "80kg cargo capacity",
        "40km range per charge",
        "Removable, standardized batteries",
        "Design compatible with available Brazilian frames",
      ],
    },
    budgetBRL: 2200,
    referenceUrl: "https://xyzcargo.com",
    referenceNote: {
      pt: "Inspiração visual, mas precisa adaptação para peças locais",
      en: "Visual inspiration, but needs adaptation for local parts",
    },
    upvotes: 412,
    preorderCount: 38,
    preorderTotalBRL: 11400,
    status: "open",
    category: { pt: "Transporte", en: "Transport" },
  },
];

const IMPROVEMENTS = [
  {
    id: "pr1",
    designId: "tanquinho-solar",
    title: { pt: "Proteção contra sobrecarga térmica do motor", en: "Thermal overload protection for motor" },
    proposer: "Carlos Silva",
    proposerLocation: "Porto Alegre, RS",
    daysAgo: 4,
    summary: {
      pt: "Adiciona fusível térmico 85°C em série com o motor. Evita queima em ciclos longos. Já testado em 3 builds.",
      en: "Adds 85°C thermal fuse in series with the motor. Prevents burnout on long cycles. Tested on 3 builds.",
    },
    changes: [
      { file: "schematic-v1.2.kicad_sch", type: "modified", lines: "+4 −1" },
      { file: "bom-estruturado.json", type: "modified", lines: "+2 −0" },
      { file: "build-instructions.md", type: "modified", lines: "+8 −2" },
    ],
    addedParts: [{ desc: "Fusível térmico 85°C 5A", qty: 1, costBRL: 4 }],
    status: "open",
    comments: 7,
    verifiedBuilds: 3,
  },
  {
    id: "pr2",
    designId: "tanquinho-solar",
    title: { pt: "Versão com motor de máquina de lavar descartada", en: "Version using motor from discarded washing machine" },
    proposer: "Oficina Reciclagem Ativa",
    proposerLocation: "Belo Horizonte, MG",
    daysAgo: 18,
    summary: {
      pt: "Fork para quem tem acesso a motores de máquinas de lavar descartadas (muito comuns em ferro-velho). Custo cai para R$ 120 total.",
      en: "Fork for those with access to discarded washing machine motors (common at scrapyards). Total cost drops to R$ 120.",
    },
    changes: [
      { file: "fork/lavadora-descartada/README.md", type: "added", lines: "+124" },
      { file: "fork/lavadora-descartada/bom.json", type: "added", lines: "+89" },
    ],
    addedParts: [],
    status: "open",
    comments: 12,
    verifiedBuilds: 6,
  },
  {
    id: "pr3",
    designId: "tanquinho-solar",
    title: { pt: "Correção: especificação do controlador PWM", en: "Fix: PWM controller specification" },
    proposer: "Ana Ribeiro (mantenedora)",
    proposerLocation: "Recife, PE",
    daysAgo: 45,
    summary: {
      pt: "Controlador PWM 10A era subdimensionado em dias quentes. Atualizado para 15A.",
      en: "10A PWM controller was undersized on hot days. Updated to 15A.",
    },
    changes: [
      { file: "bom-estruturado.json", type: "modified", lines: "+1 −1" },
    ],
    addedParts: [],
    status: "merged",
    comments: 3,
    verifiedBuilds: 1,
  },
];

const GIFT_NOTES = [
  {
    from: "Marcos Andrade",
    fromLoc: "São Paulo, SP",
    to: "Escola Rural Boa Vista",
    toLoc: "Juazeiro, BA",
    designName: { pt: "Filtro AguaClara", en: "AguaClara Filter" },
    noteFrom: {
      pt: "Minha filha estudou numa escola pequena no interior. Água é direito. Abraços da capital.",
      en: "My daughter studied at a small rural school. Water is a right. Hugs from the city.",
    },
    noteTo: {
      pt: "Chegou tudo em 9 dias. Os alunos ajudaram a montar. Mandamos foto da turma junto com o filtro — obrigado!",
      en: "Everything arrived in 9 days. Students helped assemble. Sending a photo of the class with the filter — thank you!",
    },
  },
  {
    from: "Pedro Costa",
    fromLoc: "Rio de Janeiro, RJ",
    to: "Dona Teresa",
    toLoc: "Manaus, AM",
    designName: { pt: "Kit Iluminação 12V", en: "12V Lighting Kit" },
    noteFrom: {
      pt: "Espero que ilumine muitas noites boas. Qualquer dúvida na montagem, avisa.",
      en: "Hope it lights many good evenings. Any assembly questions, just ask.",
    },
    noteTo: {
      pt: "Meu neto montou comigo. Agora a casa tem luz. Ele disse que quer ser engenheiro.",
      en: "My grandson assembled it with me. Now the house has light. He says he wants to be an engineer.",
    },
  },
];

const FABRICATORS = [
  {
    name: "Olabi Makerspace",
    city: "Rio de Janeiro, RJ",
    equipment: {
      pt: ["Impressora 3D", "Laser 60W", "CNC", "Marcenaria"],
      en: ["3D printer", "60W laser", "CNC", "Woodshop"],
    },
    rate: "R$ 40/h",
    rating: 4.8,
    jobs: 340,
  },
  {
    name: "FabLab Livre SP",
    city: "São Paulo, SP",
    equipment: {
      pt: ["Impressora 3D", "Laser", "Fresadora", "Eletrônica"],
      en: ["3D printer", "Laser", "Mill", "Electronics"],
    },
    rate: { pt: "Grátis (pública)", en: "Free (public)" },
    rating: 4.9,
    jobs: 1200,
  },
  {
    name: "Garagem Fab Lab",
    city: "Recife, PE",
    equipment: {
      pt: ["Impressora 3D", "CNC", "Solda", "Marcenaria"],
      en: ["3D printer", "CNC", "Welding", "Woodshop"],
    },
    rate: "R$ 35/h",
    rating: 4.7,
    jobs: 210,
  },
  {
    name: "NYC Resistor",
    city: "Brooklyn, NY",
    equipment: {
      pt: ["Laser", "Impressão 3D", "Eletrônica", "Metalurgia"],
      en: ["Laser", "3D printing", "Electronics", "Metal shop"],
    },
    rate: "US$ 25/hr",
    rating: 4.8,
    jobs: 890,
  },
  {
    name: "The Crucible",
    city: "Oakland, CA",
    equipment: {
      pt: ["Solda", "Ferraria", "Vidro", "Marcenaria"],
      en: ["Welding", "Blacksmithing", "Glass", "Woodshop"],
    },
    rate: "US$ 30/hr",
    rating: 4.9,
    jobs: 1540,
  },
  {
    name: "Makerbay Fortaleza",
    city: "Fortaleza, CE",
    equipment: {
      pt: ["Impressora 3D", "Marcenaria", "Eletrônica"],
      en: ["3D printer", "Woodshop", "Electronics"],
    },
    rate: "R$ 25/h",
    rating: 4.6,
    jobs: 98,
  },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; }
    body { margin: 0; }
    .gb-grain { background-image: radial-gradient(circle at 1px 1px, rgba(26,24,20,0.08) 1px, transparent 0); background-size: 3px 3px; }
    .gb-blueprint { background-image: linear-gradient(rgba(42,67,57,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(42,67,57,0.12) 1px, transparent 1px); background-size: 12px 12px; }
    .gb-fade-in { animation: gbFade 0.5s ease-out; }
    @keyframes gbFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .gb-slide { animation: gbSlide 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
    @keyframes gbSlide { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
    .gb-hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .gb-hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,24,20,0.08); }
    .gb-btn-primary { transition: all 0.15s ease; }
    .gb-btn-primary:hover { filter: brightness(0.92); }
    .gb-scroll::-webkit-scrollbar { width: 6px; }
    .gb-scroll::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 3px; }
    .gb-nav-scroll::-webkit-scrollbar { display: none; }
    .gb-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }

    /* ================== MOBILE RESPONSIVE ================== */
    @media (max-width: 860px) {
      /* Collapse all two-column layouts to single column */
      .gb-stack-mobile { grid-template-columns: 1fr !important; gap: 20px !important; }
      /* Stats grids: 4 cols → 2 cols */
      .gb-stats-4 { grid-template-columns: 1fr 1fr !important; }
      /* Scale hero typography */
      .gb-hero-h1 { font-size: 44px !important; line-height: 1.05 !important; }
      .gb-page-h1 { font-size: 34px !important; }
      .gb-splash-h1 { font-size: 48px !important; line-height: 1 !important; }
      .gb-detail-h1 { font-size: 36px !important; }
      /* Section padding tighter */
      .gb-section-pad { padding: 28px 18px 36px !important; }
      .gb-splash-pad { padding: 36px 18px 48px !important; }
      /* Horizontally scrolling nav tabs */
      .gb-nav-scroll { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; }
      .gb-nav-scroll > * { flex-shrink: 0; }
      /* Acquisition tiles: make them a bit smaller */
      .gb-acq-grid { grid-template-columns: 1fr 1fr !important; }
      /* Action buttons in design detail stack */
      .gb-actions { flex-wrap: wrap !important; }
      /* BOM table container scrolls horizontally */
      .gb-bom-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .gb-bom-wrap table { min-width: 640px; }
      /* Footer: 4-col → 2-col */
      .gb-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
      /* Hero stats compact */
      .gb-hero-pad { padding: 36px 18px 28px !important; }
    }

    @media (max-width: 520px) {
      .gb-stats-4 { grid-template-columns: 1fr 1fr !important; }
      .gb-hero-h1 { font-size: 36px !important; }
      .gb-splash-h1 { font-size: 38px !important; }
      .gb-detail-h1 { font-size: 30px !important; }
      .gb-page-h1 { font-size: 28px !important; }
      .gb-acq-grid { grid-template-columns: 1fr !important; }
      .gb-footer-grid { grid-template-columns: 1fr !important; }
      .gb-hero-pad { padding: 28px 16px 20px !important; }
      .gb-section-pad { padding: 24px 16px 32px !important; }
      .gb-splash-pad { padding: 28px 16px 40px !important; }
      .gb-header-pad { padding: 12px 16px !important; }
    }
  `}</style>
);

const TierBadge = ({ tier }) => {
  const { lang } = useL();
  const config = {
    Open: {
      bg: "transparent",
      color: COLORS.inkSoft,
      border: COLORS.line,
      icon: Circle,
      label: tr("Aberto", "Open", lang),
    },
    Verified: {
      bg: COLORS.ochre,
      color: COLORS.ink,
      border: COLORS.ochre,
      icon: FileCheck,
      label: tr("Verificado", "Verified", lang),
    },
    Certified: {
      bg: COLORS.forest,
      color: COLORS.cream,
      border: COLORS.forest,
      icon: ShieldCheck,
      label: tr("Certificado", "Certified", lang),
    },
  }[tier];
  const Icon = config.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: FONT_MONO,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

const MissionBadge = () => {
  const { lang } = useL();
  return (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 8px",
      borderRadius: 4,
      background: COLORS.clay,
      color: COLORS.cream,
      fontFamily: FONT_MONO,
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}
  >
    <HeartHandshake size={9} strokeWidth={2.5} />
    {tr("Essencial", "Essential", lang)}
  </span>
  );
};

// Abstract blueprint-style illustration for each design card
const DesignIllustration = ({ design, height = 160 }) => {
  const patterns = {
    "tanquinho-solar": (
      <>
        <circle cx="100" cy="90" r="45" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="90" r="32" stroke={COLORS.ink} strokeWidth="1" fill="none" strokeDasharray="3,3" />
        <rect x="40" y="30" width="120" height="12" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="100" y1="45" x2="100" y2="60" stroke={COLORS.ink} strokeWidth="1.5" />
        <path d="M 60 150 L 140 150" stroke={COLORS.ink} strokeWidth="1.5" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>Ø 540mm</text>
      </>
    ),
    "filtro-gravidade": (
      <>
        <path d="M 70 20 L 130 20 L 130 80 Q 130 100 100 110 Q 70 100 70 80 Z" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <line x1="70" y1="40" x2="130" y2="40" stroke={COLORS.ink} strokeWidth="1" strokeDasharray="2,2" />
        <line x1="70" y1="55" x2="130" y2="55" stroke={COLORS.ink} strokeWidth="1" strokeDasharray="2,2" />
        <line x1="70" y1="70" x2="130" y2="70" stroke={COLORS.ink} strokeWidth="1" strokeDasharray="2,2" />
        <circle cx="100" cy="140" r="4" fill={COLORS.forest} />
        <line x1="100" y1="110" x2="100" y2="140" stroke={COLORS.ink} strokeWidth="2" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>≥ 2 NTU → &lt;0.3 NTU</text>
      </>
    ),
    "ar-condicionado-pvc": (
      <>
        <rect x="55" y="40" width="90" height="70" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <circle cx="80" cy="65" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <circle cx="100" cy="65" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <circle cx="120" cy="65" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <circle cx="80" cy="85" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <circle cx="100" cy="85" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <circle cx="120" cy="85" r="6" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <path d="M 100 110 L 100 140" stroke={COLORS.clay} strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>-8°C ΔT</text>
      </>
    ),
    "gerador-bicicleta": (
      <>
        <circle cx="75" cy="100" r="28" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <circle cx="75" cy="100" r="22" stroke={COLORS.ink} strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
        <circle cx="135" cy="100" r="18" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <line x1="103" y1="100" x2="117" y2="100" stroke={COLORS.ink} strokeWidth="1" />
        <rect x="125" y="50" width="30" height="20" fill={COLORS.forest} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="140" y1="70" x2="135" y2="85" stroke={COLORS.ink} strokeWidth="1" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>5V · 2A USB</text>
      </>
    ),
    "luz-led-12v": (
      <>
        <rect x="40" y="40" width="30" height="20" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="70" y1="50" x2="130" y2="50" stroke={COLORS.ink} strokeWidth="1.5" />
        <circle cx="140" cy="50" r="8" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="100" y1="50" x2="100" y2="80" stroke={COLORS.ink} strokeWidth="1" />
        <circle cx="100" cy="88" r="8" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="100" y1="50" x2="70" y2="110" stroke={COLORS.ink} strokeWidth="1" />
        <circle cx="65" cy="115" r="8" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="100" y1="50" x2="130" y2="110" stroke={COLORS.ink} strokeWidth="1" />
        <circle cx="135" cy="115" r="8" fill={COLORS.ochre} stroke={COLORS.ink} strokeWidth="1" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>12V DC · 4 cômodos</text>
      </>
    ),
    "mesa-concreto": (
      <>
        <rect x="40" y="60" width="120" height="20" fill={COLORS.muted} stroke={COLORS.ink} strokeWidth="1.5" />
        <rect x="50" y="80" width="10" height="60" fill={COLORS.inkSoft} stroke={COLORS.ink} strokeWidth="1" />
        <rect x="140" y="80" width="10" height="60" fill={COLORS.inkSoft} stroke={COLORS.ink} strokeWidth="1" />
        <line x1="40" y1="60" x2="160" y2="60" stroke={COLORS.ink} strokeWidth="0.5" strokeDasharray="1,2" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>ajustável 1200–2000mm</text>
      </>
    ),
    "moinho-bike": (
      <>
        <circle cx="70" cy="100" r="25" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <rect x="95" y="85" width="60" height="30" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <path d="M 110 85 L 110 75 L 145 75 L 145 85" stroke={COLORS.ink} strokeWidth="1" fill="none" />
        <path d="M 105 115 L 105 130 L 140 130 L 140 115" stroke={COLORS.clay} strokeWidth="1.5" fill="none" />
        <line x1="95" y1="100" x2="85" y2="100" stroke={COLORS.ink} strokeWidth="1" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>2 kg/h · milho</text>
      </>
    ),
    "capta-chuva": (
      <>
        <path d="M 40 60 L 100 30 L 160 60" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <line x1="100" y1="30" x2="100" y2="60" stroke={COLORS.ink} strokeWidth="1" strokeDasharray="2,2" />
        <rect x="130" y="90" width="25" height="40" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        <path d="M 155 60 L 155 90" stroke={COLORS.ink} strokeWidth="2" />
        <path d="M 45 75 Q 50 70 55 75 M 65 80 Q 70 75 75 80 M 85 75 Q 90 70 95 75" stroke={COLORS.forest} strokeWidth="1" fill="none" />
        <text x="100" y="175" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill={COLORS.muted}>~2000L capacidade</text>
      </>
    ),
  };

  return (
    <div
      className="gb-blueprint"
      style={{
        height,
        background: COLORS.cream,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.clay} />
          </marker>
        </defs>
        {patterns[design.id] || (
          <rect x="40" y="40" width="120" height="120" stroke={COLORS.ink} strokeWidth="1.5" fill="none" />
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: COLORS.muted,
          letterSpacing: "0.05em",
        }}
      >
        {design.id.toUpperCase().replace(/-/g, "·")}
      </div>
    </div>
  );
};

// ============================================================
// HEADER / NAV
// ============================================================
const Header = ({ view, setView, region, setRegion, credits = 0 }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const tabs = [
    { id: "catalog", label: tr("Catálogo", "Catalog", lang) },
    { id: "builds", label: tr("Construções", "Builds", lang) },
    { id: "requests", label: tr("Pedidos", "Requests", lang) },
    { id: "fabricators", label: tr("Fabricantes", "Fabricators", lang) },
    { id: "submit", label: tr("Publicar", "Publish", lang) },
  ];
  return (
    <header
      style={{
        borderBottom: `1px solid ${COLORS.line}`,
        background: COLORS.paper,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="gb-header-pad"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setView("splash")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: 500,
              fontStyle: "italic",
              color: COLORS.clay,
              letterSpacing: "-0.02em",
            }}
          >
            Gambiarra
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            v0.1 · {tr("protótipo", "prototype", lang)}
          </span>
        </button>

        <nav className="gb-nav-scroll" style={{ display: "flex", gap: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                padding: "8px 14px",
                background: view === tab.id ? COLORS.ink : "transparent",
                color: view === tab.id ? COLORS.cream : COLORS.inkSoft,
                border: "none",
                borderRadius: 3,
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setView("credits")}
            title={tr("Meus créditos", "My credits", region === "Brasil" ? "pt" : "en")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              background: view === "credits" ? COLORS.ochre : COLORS.cream,
              color: view === "credits" ? COLORS.ink : COLORS.ink,
              border: `1px solid ${view === "credits" ? COLORS.ochre : COLORS.line}`,
              borderRadius: 999,
              fontFamily: FONT_MONO,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Award size={12} strokeWidth={2.5} color={view === "credits" ? COLORS.ink : COLORS.clay} />
            {credits} <span style={{ color: COLORS.muted, fontWeight: 400, marginLeft: 2 }}>crd</span>
          </button>
          <div
            style={{
              display: "flex",
              padding: 2,
              background: COLORS.paperDark,
              borderRadius: 3,
              fontFamily: FONT_MONO,
              fontSize: 11,
            }}
          >
            {["Brasil", "USA"].map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                style={{
                  padding: "4px 10px",
                  background: region === r ? COLORS.paper : "transparent",
                  color: region === r ? COLORS.ink : COLORS.muted,
                  border: "none",
                  borderRadius: 2,
                  cursor: "pointer",
                  fontFamily: FONT_MONO,
                  fontWeight: region === r ? 600 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================
// CATALOG VIEW
// ============================================================
const Hero = () => {
  const { lang } = useL();
  return (
  <div
    className="gb-hero-pad"
    style={{
      padding: "56px 28px 40px",
      maxWidth: 1240,
      margin: "0 auto",
      borderBottom: `1px solid ${COLORS.line}`,
    }}
  >
    <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 48, alignItems: "end" }}>
      <div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.clay,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          {tr("·  Projetos abertos · Materiais locais · Verificados", "·  Open designs · Local materials · Verified", lang)}
        </div>
        <h1
          className="gb-hero-h1"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 68,
            fontWeight: 400,
            lineHeight: 1.02,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          {tr("Engenharia para o que ", "Engineering for what's ", lang)}
          <em style={{ color: COLORS.clay, fontWeight: 500 }}>
            {tr("já existe na esquina.", "already on your block.", lang)}
          </em>
        </h1>
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: 17,
            lineHeight: 1.5,
            color: COLORS.inkSoft,
            marginTop: 20,
            maxWidth: 560,
          }}
        >
          {tr(
            "Projetos de código aberto para bens essenciais — máquinas de lavar, filtros de água, refrigeração, iluminação — feitos com materiais que você encontra no depósito do bairro. Lista de materiais estruturada. Fornecedores locais. Construções verificadas.",
            "Open-source designs for essential goods — washing machines, water filters, refrigeration, lighting — built from materials you can find at the neighborhood hardware store. Structured BOMs. Local suppliers. Verified builds.",
            lang
          )}
        </p>
      </div>
      <div
        style={{
          padding: 24,
          background: COLORS.cream,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.muted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12,
          }}
        >
          {tr("Estado da rede", "Network state", lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: tr("Projetos", "Designs", lang), value: "142" },
            { label: tr("Construções", "Builds", lang), value: "2.7k" },
            { label: tr("Makerspaces", "Makerspaces", lang), value: "38" },
            { label: tr("Países", "Countries", lang), value: "2" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 32,
                  fontWeight: 500,
                  color: COLORS.ink,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: COLORS.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

const RequirementBadge = ({ type }) => {
  const { lang } = useL();
  const config = {
    equipment: {
      label: tr("Equip. especial", "Special equip.", lang),
      bg: COLORS.cream,
      border: COLORS.muted,
      color: COLORS.inkSoft,
      icon: Factory,
    },
    certification: {
      label: tr("Requer cert.", "Cert. required", lang),
      bg: `${COLORS.clay}20`,
      border: COLORS.clay,
      color: COLORS.clay,
      icon: Award,
    },
  }[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 7px",
        borderRadius: 4,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: FONT_MONO,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <Icon size={9} strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

const DesignCard = ({ design, region, onClick }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const priceLabel =
    region === "Brasil"
      ? `R$ ${design.partsCostBRL}`
      : `US$ ${design.partsCostUSD}`;
  const name = lang === "en" && design.nameEn ? design.nameEn : design.name;
  return (
    <button
      onClick={onClick}
      className="gb-hover-lift gb-fade-in"
      style={{
        textAlign: "left",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DesignIllustration design={design} />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <TierBadge tier={design.tier} />
          {design.missionEssential && <MissionBadge />}
          {design.requirements?.equipment?.length > 0 && <RequirementBadge type="equipment" />}
          {design.requirements?.certification?.length > 0 && <RequirementBadge type="certification" />}
        </div>
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 500,
            margin: "0 0 4px",
            color: COLORS.ink,
            letterSpacing: "-0.015em",
          }}
        >
          {name}
        </h3>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.muted,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {design.designer} · {design.designerLocation}
        </div>
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.inkSoft,
            lineHeight: 1.45,
            margin: "8px 0 14px",
          }}
        >
          {pick(design.tagline, lang)}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingTop: 12,
            borderTop: `1px dashed ${COLORS.line}`,
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.inkSoft,
          }}
        >
          <span>
            <strong style={{ color: COLORS.ink, fontSize: 13 }}>{priceLabel}</strong>{" "}
            <span style={{ color: COLORS.muted }}>{tr("materiais", "materials", lang)}</span>
          </span>
          <span>
            <Users size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            {design.buildCount}
          </span>
          <span>
            <Star size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} fill={COLORS.ochre} stroke={COLORS.ochre} />
            {design.stars}
          </span>
        </div>
      </div>
    </button>
  );
};

const CatalogView = ({ onSelectDesign, region }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const CATEGORIES = getCategories(lang);
  const regionCode = region === "Brasil" ? "BR" : "US";
  const [category, setCategory] = useState("all");
  const [essentialOnly, setEssentialOnly] = useState(false);
  const [tierFilter, setTierFilter] = useState("all");
  const [basicToolsOnly, setBasicToolsOnly] = useState(false);
  const [noCertOnly, setNoCertOnly] = useState(false);
  const [buyType, setBuyType] = useState("any"); // any | plans | materials | alacarte | kit | hire

  const filtered = DESIGNS.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (essentialOnly && !d.missionEssential) return false;
    if (tierFilter !== "all" && d.tier.toLowerCase() !== tierFilter) return false;
    const req = d.requirements || { certification: [], equipment: [] };
    if (basicToolsOnly && req.equipment && req.equipment.length > 0) return false;
    if (noCertOnly && req.certification && req.certification.length > 0) return false;
    // Buy type filter: plans/materials/alacarte are universal; kit/hire are region-gated
    if (buyType === "kit") {
      const kitRegions = d.availability?.kit || [];
      if (!kitRegions.includes(regionCode)) return false;
    } else if (buyType === "hire") {
      const hireRegions = d.availability?.hire || [];
      if (!hireRegions.includes(regionCode)) return false;
    }
    // plans/materials/alacarte don't filter anything out — they're always available
    return true;
  });

  return (
    <>
      <Hero />
      <div className="gb-section-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px" }}>
        {/* Category row */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  background: active ? COLORS.ink : COLORS.paper,
                  color: active ? COLORS.cream : COLORS.inkSoft,
                  border: `1px solid ${active ? COLORS.ink : COLORS.line}`,
                  borderRadius: 999,
                  fontFamily: FONT_SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={13} strokeWidth={2} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Buy type filter — prominent since it drives what customer receives */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.clay,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {tr("Quero receber:", "I want:", lang)}
          </span>
          {[
            { id: "any", label: tr("Qualquer", "Any", lang), icon: null },
            { id: "plans", label: tr("Só o projeto", "Plans only", lang), icon: Download },
            { id: "materials", label: tr("Lista de materiais", "Shopping list", lang), icon: Package },
            { id: "alacarte", label: tr("À la carte", "À la carte", lang), icon: Replace },
            { id: "kit", label: tr("Kit completo", "Complete kit", lang), icon: Truck },
            { id: "hire", label: tr("Contratar maker", "Hire a maker", lang), icon: UserCheck },
          ].map((bt) => {
            const active = buyType === bt.id;
            const Icon = bt.icon;
            return (
              <button
                key={bt.id}
                onClick={() => setBuyType(bt.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: active ? COLORS.ink : COLORS.paper,
                  color: active ? COLORS.cream : COLORS.inkSoft,
                  border: `1px solid ${active ? COLORS.ink : COLORS.line}`,
                  borderRadius: 999,
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {Icon && <Icon size={12} strokeWidth={2} />}
                {bt.label}
              </button>
            );
          })}
        </div>

        {/* Filter row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            paddingBottom: 14,
            borderBottom: `1px solid ${COLORS.line}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: FONT_SANS, fontSize: 13, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: COLORS.inkSoft }}>
              <input
                type="checkbox"
                checked={essentialOnly}
                onChange={(e) => setEssentialOnly(e.target.checked)}
                style={{ accentColor: COLORS.clay }}
              />
              {tr("Só essenciais", "Essentials only", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: COLORS.inkSoft }}>
              <input
                type="checkbox"
                checked={basicToolsOnly}
                onChange={(e) => setBasicToolsOnly(e.target.checked)}
                style={{ accentColor: COLORS.forestSoft }}
              />
              {tr("Só ferramentas básicas", "Basic tools only", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: COLORS.inkSoft }}>
              <input
                type="checkbox"
                checked={noCertOnly}
                onChange={(e) => setNoCertOnly(e.target.checked)}
                style={{ accentColor: COLORS.forestSoft }}
              />
              {tr("Sem certificação", "No certification", lang)}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 11 }}>{tr("Nível:", "Tier:", lang)}</span>
              {["all", "open", "verified", "certified"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  style={{
                    padding: "3px 9px",
                    background: tierFilter === t ? COLORS.ochre : "transparent",
                    color: tierFilter === t ? COLORS.ink : COLORS.muted,
                    border: `1px solid ${tierFilter === t ? COLORS.ochre : COLORS.line}`,
                    borderRadius: 3,
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t === "all" ? tr("todos", "all", lang) : t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>
            {filtered.length} {filtered.length === 1 ? tr("projeto", "design", lang) : tr("projetos", "designs", lang)}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {filtered.map((d) => (
            <DesignCard key={d.id} design={d} region={region} onClick={() => onSelectDesign(d)} />
          ))}
        </div>
      </div>
    </>
  );
};

const ImprovementsSection = ({ designId }) => {
  const { lang } = useL();
  const prs = IMPROVEMENTS.filter((p) => p.designId === designId);
  if (prs.length === 0) return null;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          background: COLORS.paperDark,
          borderBottom: `1px solid ${COLORS.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink, display: "flex", alignItems: "center", gap: 8 }}>
            <GitPullRequest size={14} />
            {tr("Propostas de melhoria", "Improvement proposals", lang)}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
            {prs.filter((p) => p.status === "open").length} {tr("abertas", "open", lang)} · {prs.filter((p) => p.status === "merged").length} {tr("aplicadas", "merged", lang)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, fontWeight: 600, whiteSpace: "nowrap" }}>
            +100–500 {tr("crd", "crd", lang)}
          </span>
          <button
            style={{
              padding: "7px 12px",
              background: "transparent",
              color: COLORS.ink,
              border: `1px solid ${COLORS.ink}`,
              borderRadius: 3,
              fontFamily: FONT_SANS,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Plus size={12} /> {tr("Propor melhoria", "Propose change", lang)}
          </button>
        </div>
      </div>
      {prs.map((pr, i) => {
        const isMerged = pr.status === "merged";
        return (
          <div
            key={pr.id}
            style={{
              padding: 16,
              borderBottom: i < prs.length - 1 ? `1px solid ${COLORS.line}` : "none",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isMerged ? COLORS.forest : COLORS.ochre,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {isMerged ? (
                  <GitMerge size={14} color={COLORS.cream} strokeWidth={2.5} />
                ) : (
                  <GitPullRequest size={14} color={COLORS.ink} strokeWidth={2.5} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
                    {pick(pr.title, lang) || pr.title}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    #{pr.id.replace("pr", "")} · {isMerged ? tr("aplicada", "merged", lang) : tr("aberta", "open", lang)}
                  </div>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                  {pr.proposer} · {pr.proposerLocation} · {lang === "pt" ? `há ${pr.daysAgo}d` : `${pr.daysAgo}d ago`}
                </div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, margin: "10px 0" }}>
                  {pick(pr.summary, lang) || pr.summary}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8 }}>
                  {pr.changes.map((c, j) => (
                    <div
                      key={j}
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        color: COLORS.inkSoft,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 2,
                          fontSize: 9,
                          fontWeight: 600,
                          background:
                            c.type === "added" ? "#D4E5D6" : c.type === "modified" ? "#F0E3C2" : "#EEDDDD",
                          color:
                            c.type === "added" ? COLORS.forest : c.type === "modified" ? COLORS.ochreDark : COLORS.clayDark,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {c.type}
                      </span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{c.file}</span>
                      <span style={{ color: COLORS.muted, fontSize: 10 }}>{c.lines}</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: `1px dashed ${COLORS.line}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MessageCircle size={11} /> {pr.comments}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={11} /> {pr.verifiedBuilds} {tr("construções verificadas", "verified builds", lang)}
                    </span>
                  </div>
                  {!isMerged && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={{
                          padding: "5px 10px",
                          background: "transparent",
                          color: COLORS.inkSoft,
                          border: `1px solid ${COLORS.line}`,
                          borderRadius: 3,
                          fontFamily: FONT_SANS,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {tr("Comentar", "Comment", lang)}
                      </button>
                      <button
                        style={{
                          padding: "5px 10px",
                          background: COLORS.forest,
                          color: COLORS.cream,
                          border: "none",
                          borderRadius: 3,
                          fontFamily: FONT_SANS,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <GitMerge size={11} /> {tr("Aplicar", "Merge", lang)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Select a plausible "local maker" for hire from the FABRICATORS list based on region.
const pickLocalMaker = (region) => {
  const candidates = FABRICATORS.filter((f) => {
    const isBR = /, [A-Z]{2}$/.test(f.city) && !f.city.endsWith(", NY") && !f.city.endsWith(", CA");
    return region === "Brasil" ? isBR : !isBR;
  });
  return candidates[0] || FABRICATORS[0];
};

const AcquisitionOptions = ({ design, region, onViewBOM }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const currency = region === "Brasil" ? "R$" : "US$";
  const partsCost = region === "Brasil" ? design.partsCostBRL : design.partsCostUSD;
  const regionCode = region === "Brasil" ? "BR" : "US";
  const otherRegionLabel = region === "Brasil" ? "USA" : "Brasil";

  // Kit = parts + packing/cutting/shipping surcharge (~35%)
  const kitCost = Math.round(partsCost * 1.35);
  // Hire = parts + labor (build hours × typical local rate) + 10% platform fee
  const hourlyRate = region === "Brasil" ? 45 : 30;
  const laborCost = Math.round(design.buildHours * hourlyRate);
  const hireCost = Math.round((partsCost + laborCost) * 1.1);
  const localMaker = pickLocalMaker(region);

  const kitRegions = design.availability?.kit || [];
  const hireRegions = design.availability?.hire || [];
  const kitAvailable = kitRegions.includes(regionCode);
  const hireAvailable = hireRegions.includes(regionCode);
  const kitElsewhere = kitRegions.length > 0 && !kitAvailable;
  const hireElsewhere = hireRegions.length > 0 && !hireAvailable;

  // Default selection: pick the first available option (materials if available, else plans)
  const [selected, setSelected] = useState("materials");

  const options = [
    {
      id: "plans",
      icon: Download,
      title: tr("Só o projeto", "Plans only", lang),
      price: tr("Grátis", "Free", lang),
      sub: tr("Arquivos CAD + BOM", "CAD files + BOM", lang),
      desc: tr(
        "Você já tem ferramentas e quer sourcing próprio.",
        "You have tools and want to source parts yourself.",
        lang
      ),
      timeline: tr("imediato", "instant", lang),
      cta: tr("Baixar arquivos", "Download files", lang),
      accent: COLORS.muted,
    },
    {
      id: "materials",
      icon: Package,
      title: tr("Lista de materiais", "Shopping list", lang),
      price: `${currency} ${partsCost}`,
      sub: tr("Carrinho multi-fornecedor", "Multi-supplier cart", lang),
      desc: tr(
        "Compre as peças nos fornecedores mais baratos da sua região.",
        "Buy parts from the cheapest suppliers in your region.",
        lang
      ),
      timeline: tr("3–7 dias", "3–7 days", lang),
      cta: tr("Ver lista", "View list", lang),
      accent: COLORS.ochre,
      onClick: onViewBOM,
    },
    {
      id: "alacarte",
      icon: Replace,
      title: tr("À la carte", "À la carte", lang),
      price: tr("Variável", "Variable", lang),
      sub: tr("Escolha item por item", "Item by item", lang),
      desc: tr(
        "Peça só o que for difícil achar. Já tem o motor? Pula. Falta o painel? Adiciona.",
        "Order only what's hard to find locally. Already have the motor? Skip it. Missing the panel? Add it.",
        lang
      ),
      timeline: tr("3–7 dias", "3–7 days", lang),
      cta: tr("Escolher itens", "Pick items", lang),
      accent: COLORS.forestSoft,
    },
    {
      id: "kit",
      icon: Truck,
      title: tr("Kit completo", "Complete kit", lang),
      price: `${currency} ${kitCost}`,
      sub: tr("Tudo separado e cortado", "Pre-sorted and pre-cut", lang),
      desc: tr(
        "Todas as peças em uma caixa. Material já dimensionado. Pronto para montar.",
        "Every part in one box. Material cut to size. Ready to assemble.",
        lang
      ),
      timeline: tr("5–10 dias", "5–10 days", lang),
      cta: tr("Pedir kit", "Order kit", lang),
      accent: COLORS.forest,
      badge: kitAvailable ? tr("POPULAR", "POPULAR", lang) : null,
      unavailable: !kitAvailable,
      unavailableNote: kitElsewhere
        ? tr(`Disponível em ${otherRegionLabel}`, `Available in ${otherRegionLabel}`, lang)
        : tr("Kit ainda não oferecido", "Kit not offered yet", lang),
    },
    {
      id: "hire",
      icon: UserCheck,
      title: tr("Contratar maker", "Hire a maker", lang),
      price: `${currency} ${hireCost}`,
      sub: tr(`${design.buildHours}h × ${currency} ${hourlyRate}/h`, `${design.buildHours}h × ${currency} ${hourlyRate}/hr`, lang),
      desc: tr(
        "Um maker local constrói para você. Produto pronto entregue na sua porta.",
        "A local maker builds it for you. Finished product delivered to your door.",
        lang
      ),
      timeline: tr("2–4 semanas", "2–4 weeks", lang),
      cta: tr("Encontrar maker", "Find a maker", lang),
      accent: COLORS.clay,
      localMaker: hireAvailable ? localMaker : null,
      unavailable: !hireAvailable,
      unavailableNote: hireElsewhere
        ? tr(`Makers disponíveis em ${otherRegionLabel}`, `Makers available in ${otherRegionLabel}`, lang)
        : tr("Ainda sem makers para este projeto", "No makers for this design yet", lang),
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}
      >
        {tr("Como você quer receber?", "How do you want it?", lang)}
      </div>
      <div
        className="gb-acq-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              disabled={opt.unavailable}
              onClick={() => {
                if (opt.unavailable) return;
                setSelected(opt.id);
                if (opt.onClick) opt.onClick();
              }}
              style={{
                position: "relative",
                textAlign: "left",
                padding: 14,
                background: isActive ? COLORS.paper : COLORS.cream,
                border: isActive ? `2px solid ${opt.accent}` : `1px solid ${COLORS.line}`,
                borderRadius: 4,
                cursor: opt.unavailable ? "not-allowed" : "pointer",
                opacity: opt.unavailable ? 0.55 : 1,
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 180,
              }}
            >
              {opt.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: 10,
                    background: opt.accent,
                    color: COLORS.cream,
                    padding: "2px 7px",
                    borderRadius: 2,
                    fontFamily: FONT_MONO,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  {opt.badge}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 3,
                    background: isActive ? opt.accent : COLORS.paperDark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} color={isActive ? COLORS.cream : COLORS.inkSoft} strokeWidth={2} />
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 15,
                    fontWeight: 600,
                    color: COLORS.ink,
                    lineHeight: 1.15,
                  }}
                >
                  {opt.title}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: 600,
                    color: COLORS.ink,
                    lineHeight: 1,
                  }}
                >
                  {opt.price}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 3 }}>
                  {opt.sub}
                </div>
              </div>

              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  color: COLORS.inkSoft,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {opt.desc}
              </div>

              {opt.localMaker && (
                <div
                  style={{
                    padding: "6px 8px",
                    background: COLORS.paperDark,
                    borderRadius: 3,
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: COLORS.inkSoft,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    lineHeight: 1.3,
                  }}
                >
                  <MapPin size={10} color={opt.accent} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.localMaker.name} · {opt.localMaker.city}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: `1px dashed ${COLORS.line}`,
                  marginTop: "auto",
                }}
              >
                {opt.unavailable ? (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {opt.unavailableNote}
                  </span>
                ) : (
                  <>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>
                      <Clock size={9} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
                      {opt.timeline}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 11,
                        fontWeight: 600,
                        color: isActive ? opt.accent : COLORS.inkSoft,
                      }}
                    >
                      {opt.cta} →
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Contextual detail for the selected option */}
      {selected === "alacarte" && (
        <ALaCartePanel design={design} region={region} currency={currency} lang={lang} />
      )}
      {selected === "hire" && (
        <HireMakerPanel design={design} region={region} localMaker={localMaker} hireCost={hireCost} laborCost={laborCost} partsCost={partsCost} currency={currency} lang={lang} />
      )}
      {selected === "kit" && (
        <KitPanel design={design} region={region} kitCost={kitCost} partsCost={partsCost} currency={currency} lang={lang} />
      )}
    </div>
  );
};

const ALaCartePanel = ({ design, region, currency, lang }) => {
  const bom = getBOM(design.id) || BOM_TANQUINHO; // fallback to sample if no dedicated BOM yet
  // Start with all items selected; user unchecks what they'll source elsewhere
  const [selectedItems, setSelectedItems] = useState(
    () => new Set(bom.map((_, i) => i))
  );
  const [creditsApplied, setCreditsApplied] = useState({ credits: 0, discount: 0 });

  const toggle = (i) => {
    const next = new Set(selectedItems);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedItems(next);
  };

  const subtotal = bom.reduce((acc, item, i) => {
    if (!selectedItems.has(i)) return acc;
    const local = region === "Brasil" ? item.br : item.us;
    return acc + local.price * item.qty;
  }, 0);
  const finalTotal = Math.max(0, subtotal - creditsApplied.discount);

  const skippedCount = bom.length - selectedItems.size;
  const criticalSkipped = bom.filter(
    (item, i) => !selectedItems.has(i) && item.critical
  ).length;

  return (
    <div
      className="gb-fade-in"
      style={{
        marginTop: 16,
        padding: 20,
        background: COLORS.paper,
        border: `1px solid ${COLORS.forestSoft}`,
        borderRadius: 4,
      }}
    >
      <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.forestSoft, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            {tr("Marque o que quer pedir pela Gambiarra", "Check what you want to order through Gambiarra", lang)}
          </div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: "0 0 4px" }}>
            {tr("Pegue só o que falta.", "Just what you're missing.", lang)}
          </h3>
          <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
            {tr(
              "Os itens desmarcados ficam por sua conta — use o que já tem ou compre localmente.",
              "Unchecked items are on you — use what you already have or buy locally.",
              lang
            )}
          </p>

          <div
            className="gb-scroll"
            style={{
              maxHeight: 320,
              overflowY: "auto",
              background: COLORS.cream,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 3,
            }}
          >
            {bom.map((item, i) => {
              const local = region === "Brasil" ? item.br : item.us;
              const isSelected = selectedItems.has(i);
              return (
                <label
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderBottom: i < bom.length - 1 ? `1px solid ${COLORS.line}` : "none",
                    cursor: "pointer",
                    opacity: isSelected ? 1 : 0.5,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(i)}
                    style={{ accentColor: COLORS.forestSoft, cursor: "pointer" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: COLORS.ink, lineHeight: 1.3 }}>
                      {pick(item.desc, lang) || item.desc}
                      {item.critical && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: COLORS.clay,
                            fontFamily: FONT_MONO,
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          ● {tr("crítico", "critical", lang)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                      {item.qty} {item.unit} · {local.supplier}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
                      {currency} {(local.price * item.qty).toFixed(2)}
                    </div>
                    {!isSelected && (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, marginTop: 2, fontStyle: "italic" }}>
                        {tr("você resolve", "you handle", lang)}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {criticalSkipped > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: `${COLORS.clay}15`,
                border: `1px solid ${COLORS.clay}`,
                borderRadius: 3,
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.clayDark,
                lineHeight: 1.5,
                display: "flex",
                alignItems: "start",
                gap: 8,
              }}
            >
              <AlertTriangle size={14} color={COLORS.clay} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {tr(
                  `Você desmarcou ${criticalSkipped} ${criticalSkipped === 1 ? "item crítico" : "itens críticos"}. Confira que consegue achar ${criticalSkipped === 1 ? "ele" : "eles"} localmente antes de montar.`,
                  `You unchecked ${criticalSkipped} critical ${criticalSkipped === 1 ? "item" : "items"}. Make sure you can source ${criticalSkipped === 1 ? "it" : "them"} locally before assembling.`,
                  lang
                )}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            background: COLORS.cream,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            padding: 14,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {tr("Seu pedido", "Your order", lang)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
            <span>{tr("Itens selecionados", "Items selected", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{selectedItems.size} / {bom.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, borderBottom: `1px dashed ${COLORS.line}` }}>
            <span>{tr("Itens por sua conta", "On your end", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{skippedCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft }}>
            <span>{tr("Subtotal", "Subtotal", lang)}</span>
            <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{currency} {subtotal.toFixed(2)}</span>
          </div>
          {subtotal > 0 && (
            <CreditApplier subtotal={subtotal} region={region} lang={lang} onChange={setCreditsApplied} />
          )}
          {creditsApplied.credits > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.clay }}>
              <span>{tr(`Créditos (${creditsApplied.credits} crd)`, `Credits (${creditsApplied.credits} crd)`, lang)}</span>
              <span style={{ fontFamily: FONT_MONO }}>−{currency} {creditsApplied.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>
            <span>{tr("Total", "Total", lang)}</span>
            <span>{currency} {finalTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 12, lineHeight: 1.5 }}>
            {tr(
              "Entrega agregada do fornecedor mais próximo. Frete calculado no checkout.",
              "Consolidated shipment from nearest supplier. Shipping calculated at checkout.",
              lang
            )}
          </div>
          <button
            disabled={selectedItems.size === 0}
            style={{
              marginTop: "auto",
              padding: "12px",
              background: selectedItems.size === 0 ? COLORS.muted : COLORS.forestSoft,
              color: COLORS.cream,
              border: "none",
              borderRadius: 3,
              fontFamily: FONT_SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: selectedItems.size === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: selectedItems.size === 0 ? 0.6 : 1,
            }}
          >
            <Package size={14} /> {tr("Pedir selecionados", "Order selected", lang)} ({currency} {finalTotal.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

// Credit applier used in Kit, Hire, and À la carte checkout breakdowns.
// Lets the user slide how many credits to apply — capped at 50% of the subtotal
// (or at their balance, whichever is lower). Stateful locally; doesn't mutate balance
// until the user commits via the checkout button. Returns the credits applied via a callback.
const CreditApplier = ({ subtotal, region, lang, onChange }) => {
  const { credits } = useCredits();
  const creditValue = region === "Brasil" ? 0.5 : 0.1; // R$ or US$ per credit
  const currency = region === "Brasil" ? "R$" : "US$";
  // Max credits user can apply: lesser of balance or value that covers 50% of subtotal
  const maxByCap = Math.floor((subtotal * 0.5) / creditValue);
  const maxApplicable = Math.min(credits, maxByCap);
  const [applied, setApplied] = useState(0);
  // Clamp on render in case max shrunk (e.g. balance changed externally)
  const clampedApplied = Math.min(applied, maxApplicable);

  const handleChange = (v) => {
    const clamped = Math.max(0, Math.min(maxApplicable, v));
    setApplied(clamped);
    if (onChange) onChange({ credits: clamped, discount: clamped * creditValue });
  };

  if (credits === 0) {
    return (
      <div
        style={{
          padding: "10px 12px",
          background: COLORS.cream,
          border: `1px dashed ${COLORS.line}`,
          borderRadius: 3,
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.muted,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        <Award size={11} style={{ verticalAlign: "middle", marginRight: 5, color: COLORS.muted }} />
        {tr("Ganhe créditos contribuindo pra reduzir o custo da próxima compra.", "Earn credits by contributing to reduce the cost of your next purchase.", lang)}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 10,
        background: applied > 0 ? `${COLORS.clay}12` : COLORS.cream,
        border: `1px solid ${applied > 0 ? COLORS.clay : COLORS.line}`,
        borderRadius: 3,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.ink, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
          <Award size={11} color={COLORS.clay} strokeWidth={2.5} />
          {tr("Aplicar créditos", "Apply credits", lang)}
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>
          {tr("Saldo:", "Balance:", lang)} <strong style={{ color: COLORS.ink }}>{credits}</strong>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={maxApplicable}
        step={1}
        value={clampedApplied}
        onChange={(e) => handleChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.clay, marginBottom: 4 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>
          0
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: clampedApplied > 0 ? COLORS.clay : COLORS.inkSoft, fontWeight: clampedApplied > 0 ? 600 : 400 }}>
          {clampedApplied > 0
            ? `${clampedApplied} crd → −${currency} ${(clampedApplied * creditValue).toFixed(2)}`
            : tr(`Até ${maxApplicable} crd (−${currency} ${(maxApplicable * creditValue).toFixed(2)})`, `Up to ${maxApplicable} crd (−${currency} ${(maxApplicable * creditValue).toFixed(2)})`, lang)
          }
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>
          {maxApplicable}
        </span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, marginTop: 6, textAlign: "center" }}>
        {tr("Créditos cobrem até 50% do subtotal", "Credits cover up to 50% of subtotal", lang)}
      </div>
    </div>
  );
};

const KitPanel = ({ design, kitCost, partsCost, currency, lang }) => {
  const surcharge = kitCost - partsCost;
  const region = currency === "R$" ? "Brasil" : "USA";
  const [creditsApplied, setCreditsApplied] = useState({ credits: 0, discount: 0 });
  const finalTotal = Math.max(0, kitCost - creditsApplied.discount);
  return (
    <div
      className="gb-fade-in"
      style={{
        marginTop: 16,
        padding: 20,
        background: COLORS.paper,
        border: `1px solid ${COLORS.forest}`,
        borderRadius: 4,
      }}
    >
      <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.forest, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            {tr("O que vem no kit", "What's in the kit", lang)}
          </div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: "0 0 12px" }}>
            {tr("Uma caixa · tudo pronto pra montar.", "One box · ready to assemble.", lang)}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              tr("Todas as peças da BOM pré-separadas", "All BOM parts pre-sorted", lang),
              tr("Cortes em PVC e madeira já feitos", "PVC and wood already cut", lang),
              tr("Parafusos e conectores em saquinhos numerados", "Screws and connectors in numbered bags", lang),
              tr("Manual impresso + QR para vídeo", "Printed manual + QR for video", lang),
              tr("Etiquetas em cada etapa de montagem", "Labels at each assembly step", lang),
              tr("Peças sobressalentes (parafusos críticos)", "Spare parts (critical fasteners)", lang),
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "start",
                  gap: 6,
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  color: COLORS.inkSoft,
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle2 size={12} color={COLORS.forest} strokeWidth={2.5} style={{ marginTop: 2, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          <div
            style={{
              padding: 10,
              background: COLORS.cream,
              border: `1px dashed ${COLORS.line}`,
              borderRadius: 3,
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.muted,
              lineHeight: 1.5,
            }}
          >
            {tr(
              "Os kits são montados pela rede de makerspaces parceiros mais próxima de você — reduz frete e gera trabalho local.",
              "Kits are packed by the partner makerspace nearest you — reduces shipping and creates local work.",
              lang
            )}
          </div>
        </div>

        <div
          style={{
            background: COLORS.cream,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            padding: 14,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {tr("Resumo", "Breakdown", lang)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
            <span>{tr("Materiais", "Materials", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{currency} {partsCost}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, borderBottom: `1px dashed ${COLORS.line}` }}>
            <span>{tr("Preparo + embalagem + frete", "Prep + packing + shipping", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{currency} {surcharge}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft }}>
            <span>{tr("Subtotal", "Subtotal", lang)}</span>
            <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{currency} {kitCost}</span>
          </div>
          <CreditApplier subtotal={kitCost} region={region} lang={lang} onChange={setCreditsApplied} />
          {creditsApplied.credits > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.clay }}>
              <span>{tr(`Créditos (${creditsApplied.credits} crd)`, `Credits (${creditsApplied.credits} crd)`, lang)}</span>
              <span style={{ fontFamily: FONT_MONO }}>−{currency} {creditsApplied.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>
            <span>{tr("Total", "Total", lang)}</span>
            <span>{currency} {finalTotal.toFixed(2)}</span>
          </div>
          <button
            style={{
              marginTop: "auto",
              padding: "12px",
              background: COLORS.forest,
              color: COLORS.cream,
              border: "none",
              borderRadius: 3,
              fontFamily: FONT_SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Truck size={14} /> {tr("Pedir kit", "Order kit", lang)} ({currency} {finalTotal.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

const HireMakerPanel = ({ design, localMaker, hireCost, laborCost, partsCost, currency, lang }) => {
  const platformFee = hireCost - partsCost - laborCost;
  const region = currency === "R$" ? "Brasil" : "USA";
  const [creditsApplied, setCreditsApplied] = useState({ credits: 0, discount: 0 });
  const finalTotal = Math.max(0, hireCost - creditsApplied.discount);
  // Generate a couple more candidate makers for the list
  const otherMakers = FABRICATORS.filter((f) => f.name !== localMaker.name).slice(0, 2);
  return (
    <div
      className="gb-fade-in"
      style={{
        marginTop: 16,
        padding: 20,
        background: COLORS.paper,
        border: `1px solid ${COLORS.clay}`,
        borderRadius: 4,
      }}
    >
      <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            {tr("Makers disponíveis perto de você", "Available makers near you", lang)}
          </div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: "0 0 14px" }}>
            {tr("Escolha quem constrói.", "Pick who builds it.", lang)}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[localMaker, ...otherMakers].map((maker, i) => (
              <div
                key={maker.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  background: i === 0 ? COLORS.cream : "transparent",
                  border: `1px ${i === 0 ? "solid" : "dashed"} ${i === 0 ? COLORS.clay : COLORS.line}`,
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 3,
                    background: i === 0 ? COLORS.clay : COLORS.paperDark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Hammer size={16} color={i === 0 ? COLORS.cream : COLORS.inkSoft} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
                    {maker.name}
                    {i === 0 && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontFamily: FONT_MONO,
                          fontSize: 9,
                          background: COLORS.clay,
                          color: COLORS.cream,
                          padding: "2px 6px",
                          borderRadius: 2,
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                        }}
                      >
                        {tr("MAIS PRÓXIMO", "CLOSEST", lang)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={9} /> {maker.city}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={9} fill={COLORS.ochre} stroke={COLORS.ochre} /> {maker.rating}
                    </span>
                    <span>{maker.jobs} {tr("trabalhos", "jobs", lang)}</span>
                  </div>
                </div>
                <button
                  style={{
                    padding: "7px 12px",
                    background: i === 0 ? COLORS.clay : "transparent",
                    color: i === 0 ? COLORS.cream : COLORS.ink,
                    border: `1px solid ${i === 0 ? COLORS.clay : COLORS.line}`,
                    borderRadius: 3,
                    fontFamily: FONT_SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {i === 0 ? tr("Contratar", "Hire", lang) : tr("Ver perfil", "View profile", lang)}
                </button>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: COLORS.cream,
              border: `1px dashed ${COLORS.line}`,
              borderRadius: 3,
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.muted,
              lineHeight: 1.5,
            }}
          >
            {tr(
              "Pagamento fica em garantia até você receber e confirmar. 24h para reportar problemas.",
              "Payment held in escrow until you receive and confirm. 24h to report issues.",
              lang
            )}
          </div>
        </div>

        <div
          style={{
            background: COLORS.cream,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            padding: 14,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {tr("Resumo", "Breakdown", lang)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
            <span>{tr("Materiais", "Materials", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{currency} {partsCost}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
            <span>{tr("Mão de obra", "Labor", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{currency} {laborCost}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, borderBottom: `1px dashed ${COLORS.line}` }}>
            <span>{tr("Plataforma + garantia", "Platform + escrow", lang)}</span>
            <span style={{ fontFamily: FONT_MONO }}>{currency} {platformFee}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft }}>
            <span>{tr("Subtotal", "Subtotal", lang)}</span>
            <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{currency} {hireCost}</span>
          </div>
          <CreditApplier subtotal={hireCost} region={region} lang={lang} onChange={setCreditsApplied} />
          {creditsApplied.credits > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.clay }}>
              <span>{tr(`Créditos (${creditsApplied.credits} crd)`, `Credits (${creditsApplied.credits} crd)`, lang)}</span>
              <span style={{ fontFamily: FONT_MONO }}>−{currency} {creditsApplied.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>
            <span>{tr("Total", "Total", lang)}</span>
            <span>{currency} {finalTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 12 }}>
            {tr(`Mão de obra paga ao maker. ${design.buildHours}h estimadas.`, `Labor goes to the maker. ${design.buildHours}h estimated.`, lang)}
          </div>
          <button
            style={{
              marginTop: "auto",
              padding: "12px",
              background: COLORS.clay,
              color: COLORS.cream,
              border: "none",
              borderRadius: 3,
              fontFamily: FONT_SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <UserCheck size={14} /> {tr("Contratar maker", "Hire maker", lang)} ({currency} {finalTotal.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

const GiftPanel = ({ design, region }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const currency = region === "Brasil" ? "R$" : "US$";
  const price = region === "Brasil" ? design.partsCostBRL + 40 : design.partsCostUSD + 8;
  return (
    <div
      style={{
        background: COLORS.paper,
        border: `2px solid ${COLORS.clay}`,
        borderRadius: 4,
        padding: 20,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          left: 16,
          background: COLORS.clay,
          color: COLORS.cream,
          padding: "3px 10px",
          borderRadius: 2,
          fontFamily: FONT_MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Gift size={11} />
        {tr("Modo presente", "Gift mode", lang)}
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: "6px 0 6px" }}>
        {tr("Patrocine uma construção.", "Sponsor a build.", lang)}
      </h3>
      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, margin: "0 0 16px" }}>
        {tr(
          "Seu pagamento cobre o projeto e os materiais para uma pessoa de baixa renda construir o próprio. Vocês trocam uma nota direto. Inspirado no modelo Heifer Project.",
          "Your payment covers the design plus materials for a low-income maker to build their own. You exchange direct notes. Inspired by the Heifer Project model.",
          lang
        )}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "14px 0",
          borderTop: `1px dashed ${COLORS.line}`,
          borderBottom: `1px dashed ${COLORS.line}`,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tr("Custo do patrocínio", "Sponsorship cost", lang)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: COLORS.clay, lineHeight: 1.1 }}>
            {currency} {price}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, marginTop: 2 }}>
            {tr("materiais + frete + taxa", "materials + shipping + fee", lang)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tr("Já presenteado", "Gifted", lang)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: COLORS.ink, lineHeight: 1.1 }}>
            {Math.round(design.buildCount * 0.18)}×
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, marginTop: 2 }}>
            {tr("neste projeto", "on this design", lang)}
          </div>
        </div>
      </div>
      <textarea
        placeholder={tr("Deixe uma nota para quem vai construir...", "Leave a note for whoever will build it...", lang)}
        style={{
          width: "100%",
          minHeight: 60,
          padding: 10,
          background: COLORS.cream,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 3,
          fontFamily: FONT_SANS,
          fontSize: 12,
          color: COLORS.ink,
          resize: "vertical",
          boxSizing: "border-box",
          marginBottom: 10,
          outline: "none",
        }}
      />
      <button
        style={{
          width: "100%",
          padding: "12px",
          background: COLORS.clay,
          color: COLORS.cream,
          border: "none",
          borderRadius: 3,
          fontFamily: FONT_SANS,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Gift size={14} /> {tr("Presentear este projeto", "Gift this design", lang)} ({currency} {price})
      </button>
    </div>
  );
};

const RequestCard = ({ request }) => {
  const { lang } = useL();
  const statusConfig = {
    open: { label: tr("Aberto", "Open", lang), color: COLORS.ochre, textColor: COLORS.ink },
    in_progress: { label: tr("Em desenvolvimento", "In progress", lang), color: COLORS.forest, textColor: COLORS.cream },
    fulfilled: { label: tr("Atendido", "Fulfilled", lang), color: COLORS.muted, textColor: COLORS.cream },
  }[request.status];

  return (
    <div
      className="gb-hover-lift"
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "3px 8px",
              background: statusConfig.color,
              color: statusConfig.textColor,
              borderRadius: 2,
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {statusConfig.label}
          </span>
          <span
            style={{
              padding: "3px 8px",
              background: COLORS.cream,
              color: COLORS.inkSoft,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 2,
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {pick(request.category, lang) || request.category}
          </span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, whiteSpace: "nowrap" }}>
          {lang === "pt" ? `há ${request.daysAgo}d` : `${request.daysAgo}d ago`}
        </div>
      </div>

      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 20,
          fontWeight: 500,
          color: COLORS.ink,
          margin: "0 0 6px",
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
        }}
      >
        {pick(request.title, lang) || request.title}
      </h3>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{request.requester}</span>
        <span style={{ color: COLORS.line }}>·</span>
        <span>{pick(request.requesterType, lang) || request.requesterType}</span>
        <span style={{ color: COLORS.line }}>·</span>
        <MapPin size={10} /> {request.location}
      </div>

      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, margin: "0 0 14px" }}>
        {pick(request.description, lang) || request.description}
      </p>

      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {tr("Especificações funcionais", "Functional specs", lang)}
      </div>
      <div style={{ marginBottom: 14, paddingLeft: 8, borderLeft: `2px solid ${COLORS.ochre}` }}>
        {(pick(request.specs, lang) || request.specs).map((s, i) => (
          <div key={i} style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            → {s}
          </div>
        ))}
      </div>

      {request.referenceUrl && (
        <div
          style={{
            padding: 10,
            background: COLORS.cream,
            border: `1px dashed ${COLORS.line}`,
            borderRadius: 3,
            marginBottom: 14,
            fontFamily: FONT_MONO,
            fontSize: 11,
          }}
        >
          <div style={{ color: COLORS.muted, marginBottom: 3, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
            <Link2 size={10} /> {tr("Referência externa", "External reference", lang)}
          </div>
          <div style={{ color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {request.referenceUrl}
          </div>
          {request.referenceNote && (
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.muted, marginTop: 4, fontStyle: "italic" }}>
              {pick(request.referenceNote, lang) || request.referenceNote}
            </div>
          )}
        </div>
      )}

      {request.status === "in_progress" && request.assignedTo && (
        <div
          style={{
            padding: 10,
            background: `${COLORS.forest}15`,
            border: `1px solid ${COLORS.forest}`,
            borderRadius: 3,
            marginBottom: 14,
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.forest,
          }}
        >
          <strong>{tr("Em desenvolvimento por:", "In development by:", lang)}</strong> {request.assignedTo}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 14,
          borderTop: `1px dashed ${COLORS.line}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tr("Orçamento", "Budget", lang)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
            R$ {request.budgetBRL.toLocaleString("pt-BR")}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tr("Pré-pedidos", "Pre-orders", lang)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
            {request.preorderCount}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, marginTop: 1 }}>
            R$ {request.preorderTotalBRL.toLocaleString("pt-BR")} {tr("depositados", "pledged", lang)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tr("Apoios", "Upvotes", lang)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.clay, display: "flex", alignItems: "center", gap: 2 }}>
            <ChevronUp size={14} strokeWidth={2.5} /> {request.upvotes}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button
          style={{
            padding: "10px 12px",
            background: "transparent",
            color: COLORS.ink,
            border: `1px solid ${COLORS.ink}`,
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <ChevronUp size={14} /> {tr("Apoiar", "Upvote", lang)}
        </button>
        <button
          style={{
            padding: "10px 12px",
            background: COLORS.ochre,
            color: COLORS.ink,
            border: "none",
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <DollarSign size={14} /> {tr("Pré-pedido", "Pre-order", lang)}
        </button>
      </div>
    </div>
  );
};

const NewRequestForm = () => {
  const { lang } = useL();
  return (
  <div
    style={{
      background: COLORS.cream,
      border: `2px dashed ${COLORS.line}`,
      borderRadius: 4,
      padding: 24,
      marginBottom: 28,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          {tr("Faltou um projeto?", "Missing a design?", lang)}
        </div>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: COLORS.ink, margin: 0, letterSpacing: "-0.015em" }}>
          {tr("Descreva o que você precisa, ou cole um link para formalizar.", "Describe what you need, or paste a link to formalize.", lang)}
        </h3>
      </div>
    </div>
    <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <div>
        <input
          type="text"
          placeholder={tr("Ex: Incubadora neonatal para posto rural", "e.g. Neonatal incubator for rural clinic", lang)}
          style={{
            width: "100%",
            padding: 10,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.ink,
            boxSizing: "border-box",
            marginBottom: 8,
            outline: "none",
          }}
        />
        <textarea
          placeholder={tr(
            "Funcionalidade necessária, ambiente de uso, quem vai construir...",
            "Required functionality, environment of use, who will build it...",
            lang
          )}
          style={{
            width: "100%",
            minHeight: 70,
            padding: 10,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.ink,
            resize: "vertical",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="text"
          placeholder={tr("Orçamento máximo (R$)", "Max budget (US$)", lang)}
          style={{
            padding: 10,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.ink,
            outline: "none",
          }}
        />
        <input
          type="text"
          placeholder={tr("Link de referência (opcional)", "Reference link (optional)", lang)}
          style={{
            padding: 10,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.ink,
            outline: "none",
          }}
        />
        <button
          style={{
            padding: "10px 12px",
            marginTop: "auto",
            background: COLORS.ink,
            color: COLORS.cream,
            border: "none",
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Send size={14} /> {tr("Publicar pedido", "Post request", lang)}
        </button>
      </div>
    </div>
  </div>
  );
};

const RequestsView = () => {
  const { lang } = useL();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("upvotes");

  const filtered = REQUESTS.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  }).sort((a, b) => {
    if (sortBy === "upvotes") return b.upvotes - a.upvotes;
    if (sortBy === "recent") return a.daysAgo - b.daysAgo;
    if (sortBy === "budget") return b.budgetBRL - a.budgetBRL;
    if (sortBy === "preorder") return b.preorderTotalBRL - a.preorderTotalBRL;
    return 0;
  });

  const totalPreordered = REQUESTS.reduce((acc, r) => acc + r.preorderTotalBRL, 0);

  return (
    <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 28px 56px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          {tr("Demanda · comunidade · projetistas", "Demand · community · designers", lang)}
        </div>
        <h1 className="gb-page-h1" style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 400, color: COLORS.ink, margin: 0, letterSpacing: "-0.02em" }}>
          {tr("Peça o que ", "Ask for what ", lang)}
          <em style={{ color: COLORS.clay, fontWeight: 500 }}>
            {tr("ainda não existe.", "doesn't exist yet.", lang)}
          </em>
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.inkSoft, marginTop: 12, maxWidth: 640, lineHeight: 1.5 }}>
          {tr(
            "Descreva um problema, cole um link de outro site para formalização, ou apoie pedidos existentes com pré-pedidos. Projetistas escolhem pedidos com demanda comprovada.",
            "Describe a problem, paste a link from another site for formalization, or back existing requests with pre-orders. Designers pick requests with proven demand.",
            lang
          )}
        </p>
      </div>

      {/* Stats bar */}
      <div
        className="gb-stats-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          padding: "18px 20px",
          background: COLORS.paperDark,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 4,
          marginBottom: 28,
        }}
      >
        {[
          { label: tr("Pedidos abertos", "Open requests", lang), value: REQUESTS.filter((r) => r.status === "open").length },
          { label: tr("Em desenvolvimento", "In development", lang), value: REQUESTS.filter((r) => r.status === "in_progress").length },
          { label: tr("Total em pré-pedidos", "Total pre-orders", lang), value: `R$ ${(totalPreordered / 1000).toFixed(1)}k` },
          { label: tr("Makers apoiando", "Makers backing", lang), value: REQUESTS.reduce((a, r) => a + r.upvotes, 0).toLocaleString("pt-BR") },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {s.label}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <NewRequestForm />

      {/* Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: `1px solid ${COLORS.line}`,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all", label: tr("Todos", "All", lang) },
            { id: "open", label: tr("Abertos", "Open", lang) },
            { id: "in_progress", label: tr("Em dev.", "In dev.", lang) },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 12px",
                background: filter === f.id ? COLORS.ink : "transparent",
                color: filter === f.id ? COLORS.cream : COLORS.inkSoft,
                border: `1px solid ${filter === f.id ? COLORS.ink : COLORS.line}`,
                borderRadius: 3,
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>
          <span>{tr("Ordenar por:", "Sort by:", lang)}</span>
          {[
            { id: "upvotes", label: tr("mais apoiados", "most upvoted", lang) },
            { id: "preorder", label: tr("mais pré-pedidos", "most pre-orders", lang) },
            { id: "recent", label: tr("recentes", "recent", lang) },
            { id: "budget", label: tr("orçamento", "budget", lang) },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              style={{
                background: "none",
                border: "none",
                color: sortBy === s.id ? COLORS.clay : COLORS.muted,
                fontWeight: sortBy === s.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: 11,
                padding: 0,
                textDecoration: sortBy === s.id ? "underline" : "none",
                textUnderlineOffset: 3,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        {filtered.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// DESIGN DETAIL VIEW
// ============================================================
const BOMTable = ({ region, designId }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const bom = getBOM(designId);
  const isSample = !bom;
  const rows = bom || BOM_TANQUINHO;
  const total = rows.reduce((acc, item) => {
    const p = region === "Brasil" ? item.br.price : item.us.price;
    return acc + p * item.qty;
  }, 0);
  const currency = region === "Brasil" ? "R$" : "US$";

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          background: COLORS.paperDark,
          borderBottom: `1px solid ${COLORS.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
              {tr("Lista de Materiais", "Bill of Materials", lang)}
            </div>
            {isSample && (
              <span style={{ padding: "2px 7px", background: COLORS.ochre, color: COLORS.ink, borderRadius: 2, fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {tr("Amostra", "Sample", lang)}
              </span>
            )}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
            {isSample
              ? tr("Exemplo de estrutura de BOM — cada projeto tem a sua", "Example BOM structure — each design has its own", lang)
              : tr("fornecedores ·", "suppliers ·", lang) + " " + (lang === "en" ? (region === "Brasil" ? "brazil" : "usa") : region.toLowerCase()) + " " + tr("· atualizado há 2h", "· updated 2h ago", lang)}
          </div>
        </div>
        <button
          className="gb-btn-primary"
          style={{
            padding: "8px 14px",
            background: COLORS.forest,
            color: COLORS.cream,
            border: "none",
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Package size={14} />
          {tr("Montar carrinho", "Build cart", lang)}
        </button>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }} className="gb-scroll gb-bom-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_SANS, fontSize: 12 }}>
          <thead>
            <tr style={{ background: COLORS.cream, borderBottom: `1px solid ${COLORS.line}` }}>
              {[
                tr("Item", "Item", lang),
                tr("Qtd", "Qty", lang),
                tr("Fornecedor", "Supplier", lang),
                tr("Preço", "Price", lang),
                tr("Status", "Status", lang),
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 16px",
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    fontWeight: 500,
                    color: COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => {
              const local = region === "Brasil" ? item.br : item.us;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                  <td style={{ padding: "12px 16px", color: COLORS.ink, lineHeight: 1.4, verticalAlign: "top" }}>
                    <div style={{ fontWeight: 500 }}>
                      {pick(item.desc, lang) || item.desc}
                      {item.critical && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: COLORS.clay,
                            fontFamily: FONT_MONO,
                            fontSize: 9,
                            fontWeight: 600,
                          }}
                        >
                          ● {tr("crítico", "critical", lang)}
                        </span>
                      )}
                    </div>
                    {item.part && (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                        P/N: {item.part}
                      </div>
                    )}
                    {item.alts && item.alts.length > 0 && (
                      <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `2px solid ${COLORS.ochre}` }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                          {tr("Substitutos aceitos", "Accepted substitutes", lang)} ({item.alts.length})
                        </div>
                        {item.alts.map((alt, j) => (
                          <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic", flex: 1 }}>
                              → {pick(alt.label, lang) || alt.label}
                            </span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: alt.savings.startsWith("−") ? COLORS.clay : COLORS.forest, whiteSpace: "nowrap" }}>
                              {alt.savings.startsWith("−") ? "" : "−"}{alt.savings}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: FONT_MONO, color: COLORS.inkSoft, verticalAlign: "top" }}>
                    {item.qty} {item.unit}
                  </td>
                  <td style={{ padding: "12px 16px", color: COLORS.inkSoft, verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {local.supplier}
                      <ExternalLink size={10} style={{ color: COLORS.muted }} />
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: FONT_MONO, color: COLORS.ink, verticalAlign: "top" }}>
                    {currency} {local.price.toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        color: COLORS.forestSoft,
                      }}
                    >
                      <CheckCircle2 size={10} />
                      {pick(local.stock, lang) || local.stock}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "14px 16px",
          background: COLORS.cream,
          borderTop: `1px solid ${COLORS.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>
          {rows.length} {tr("itens · entrega estimada em 3–7 dias", "items · est. delivery 3–7 days", lang)}
        </span>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: COLORS.ink }}>
          {tr("Total", "Total", lang)} {currency} {total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const ParametricPanel = ({ design }) => {
  const { lang } = useL();
  const [loadSize, setLoadSize] = useState(6);
  const [panelWatts, setPanelWatts] = useState(100);
  const hoursPerDay = (panelWatts * 4) / (loadSize * 45);

  return (
    <div
      style={{
        background: COLORS.cream,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Sliders size={14} color={COLORS.clay} />
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.clay,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {tr("Gerador paramétrico", "Parametric generator", lang)}
        </div>
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, margin: "0 0 4px", color: COLORS.ink }}>
        {tr("Ajuste ao seu uso", "Tune to your use", lang)}
      </h3>
      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.muted, margin: "0 0 20px" }}>
        {tr(
          "O projeto recalcula as dimensões e a lista de materiais com base nos seus parâmetros.",
          "The design recalculates dimensions and BOM based on your parameters.",
          lang
        )}
      </p>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.inkSoft,
            marginBottom: 6,
          }}
        >
          <span>{tr("Tamanho da carga (kg roupa seca)", "Load size (kg dry laundry)", lang)}</span>
          <strong style={{ color: COLORS.clay }}>{loadSize} kg</strong>
        </div>
        <input
          type="range"
          min="3"
          max="12"
          value={loadSize}
          onChange={(e) => setLoadSize(Number(e.target.value))}
          style={{ width: "100%", accentColor: COLORS.clay }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.inkSoft,
            marginBottom: 6,
          }}
        >
          <span>{tr("Painel solar disponível", "Available solar panel", lang)}</span>
          <strong style={{ color: COLORS.clay }}>{panelWatts}W</strong>
        </div>
        <input
          type="range"
          min="50"
          max="200"
          step="25"
          value={panelWatts}
          onChange={(e) => setPanelWatts(Number(e.target.value))}
          style={{ width: "100%", accentColor: COLORS.clay }}
        />
      </div>

      <div
        style={{
          padding: 14,
          background: COLORS.paper,
          borderRadius: 3,
          border: `1px dashed ${COLORS.line}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {[
          { label: tr("Ø Tambor", "Ø Drum", lang), value: `${Math.round(380 + loadSize * 25)} mm` },
          { label: tr("Ciclos/dia", "Cycles/day", lang), value: hoursPerDay.toFixed(1) },
          { label: tr("Custo materiais", "Material cost", lang), value: `R$ ${Math.round(220 + loadSize * 22)}` },
          { label: tr("Tempo de montagem", "Assembly time", lang), value: `${Math.round(4 + loadSize * 0.3)} h` },
        ].map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: COLORS.ink }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OperatingRangePanel = ({ constraints, lang }) => {
  if (!constraints) return null;
  const { tempMin, tempMax, humidityMax, indoorOnly, coastalRated, seismicRated } = constraints;

  // Build compact spec items — skip any that are "no constraint" to reduce noise
  const items = [];
  if (tempMin != null || tempMax != null) {
    const range = `${tempMin != null ? tempMin : "−"}°C → ${tempMax != null ? tempMax : "−"}°C`;
    items.push({ label: tr("Temperatura", "Temperature", lang), value: range });
  }
  if (humidityMax != null && humidityMax < 100) {
    items.push({ label: tr("Umidade máx.", "Max humidity", lang), value: `${humidityMax}%` });
  }
  items.push({
    label: tr("Ambiente", "Environment", lang),
    value: indoorOnly ? tr("interno", "indoor", lang) : tr("externo OK", "outdoor OK", lang),
  });
  items.push({
    label: tr("Ar marítimo", "Coastal air", lang),
    value: coastalRated ? tr("testado", "rated", lang) : tr("não testado", "not rated", lang),
    muted: !coastalRated,
  });
  if (seismicRated) {
    const seismicTr = {
      low: tr("baixo", "low", lang),
      moderate: tr("moderado", "moderate", lang),
      high: tr("alto", "high", lang),
    };
    items.push({ label: tr("Sísmico", "Seismic", lang), value: seismicTr[seismicRated] });
  }

  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        padding: "14px 16px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        {tr("Condições de operação", "Operating range", lang)}
      </div>
      <div
        className="gb-stats-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          gap: 16,
        }}
      >
        {items.map((it) => (
          <div key={it.label} style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              {it.label}
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 14,
                fontWeight: 600,
                color: it.muted ? COLORS.muted : COLORS.ink,
                lineHeight: 1.2,
              }}
            >
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BuildSteps = ({ designId }) => {
  const { lang } = useL();

  const STEPS_BY_DESIGN = {
    "tanquinho-solar": {
      summary: tr("5 etapas · 4h15 tempo ativo · nível intermediário", "5 steps · 4h15 active time · intermediate level", lang),
      steps: [
        { n: 1, title: tr("Preparar tambor", "Prepare drum", lang), time: "45 min", skill: tr("básico", "basic", lang), tools: tr("furadeira, serra copo 40mm", "drill, 40mm hole saw", lang) },
        { n: 2, title: tr("Montar base e suporte do motor", "Build base and motor mount", lang), time: "90 min", skill: tr("intermediário", "intermediate", lang), tools: tr("serra circular, chave inglesa", "circular saw, wrench", lang) },
        { n: 3, title: tr("Instalar transmissão", "Install transmission", lang), time: "60 min", skill: tr("intermediário", "intermediate", lang), tools: tr("chave de fenda, alicate", "screwdriver, pliers", lang) },
        { n: 4, title: tr("Conectar painel solar e controlador", "Connect solar panel and controller", lang), time: "45 min", skill: tr("básico", "basic", lang), tools: tr("multímetro, decapador", "multimeter, wire stripper", lang) },
        { n: 5, title: tr("Testar ciclo completo", "Test full cycle", lang), time: "30 min", skill: tr("básico", "basic", lang), tools: "—" },
      ],
    },
    "zeer-pot": {
      summary: tr("4 etapas · 1h tempo ativo · nível iniciante", "4 steps · 1h active time · beginner level", lang),
      steps: [
        { n: 1, title: tr("Vedar furo de drenagem do pote externo", "Seal drainage hole in outer pot", lang), time: "10 min", skill: tr("básico", "basic", lang), tools: tr("rolha ou cimento", "plug or cement", lang) },
        { n: 2, title: tr("Centralizar pote interno dentro do externo", "Center inner pot inside outer pot", lang), time: "5 min", skill: tr("básico", "basic", lang), tools: "—" },
        { n: 3, title: tr("Preencher espaço entre potes com areia", "Fill space between pots with sand", lang), time: "15 min", skill: tr("básico", "basic", lang), tools: tr("pá pequena", "small trowel", lang) },
        { n: 4, title: tr("Saturar areia com água e cobrir com pano úmido", "Saturate sand with water, cover with damp cloth", lang), time: "10 min", skill: tr("básico", "basic", lang), tools: tr("regador", "watering can", lang) },
      ],
    },
    "fogao-rocket": {
      summary: tr("5 etapas · 3h tempo ativo · nível iniciante", "5 steps · 3h active time · beginner level", lang),
      steps: [
        { n: 1, title: tr("Furar lata de tinta para cano de alimentação", "Cut hole in paint can for feed tube", lang), time: "20 min", skill: tr("básico", "basic", lang), tools: tr("serra copo metálica, lima", "metal hole saw, file", lang) },
        { n: 2, title: tr("Posicionar chaminé vertical interna", "Position internal vertical chimney", lang), time: "15 min", skill: tr("básico", "basic", lang), tools: tr("régua, marcador", "ruler, marker", lang) },
        { n: 3, title: tr("Conectar cano de alimentação na base", "Connect feed tube at base", lang), time: "30 min", skill: tr("intermediário", "intermediate", lang), tools: tr("cortador, alicate", "cutter, pliers", lang) },
        { n: 4, title: tr("Preencher isolamento ao redor da chaminé", "Fill insulation around chimney", lang), time: "45 min", skill: tr("básico", "basic", lang), tools: "—" },
        { n: 5, title: tr("Instalar grade para panela e testar queima", "Install pot grate and test burn", lang), time: "30 min", skill: tr("básico", "basic", lang), tools: tr("alicate, fósforos", "pliers, matches", lang) },
      ],
    },
  };

  const hasData = !!STEPS_BY_DESIGN[designId];
  const data = hasData ? STEPS_BY_DESIGN[designId] : STEPS_BY_DESIGN["tanquinho-solar"];
  const isSample = !hasData;
  const steps = data.steps;

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", background: COLORS.paperDark, borderBottom: `1px solid ${COLORS.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
            {tr("Etapas de construção", "Build steps", lang)}
          </div>
          {isSample && (
            <span style={{ padding: "2px 7px", background: COLORS.ochre, color: COLORS.ink, borderRadius: 2, fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {tr("Amostra", "Sample", lang)}
            </span>
          )}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
          {isSample
            ? tr("Estrutura de etapas — cada projeto tem as próprias", "Step structure — each design has its own", lang)
            : data.summary}
        </div>
      </div>
      <div>
        {steps.map((s, i) => (
          <div
            key={s.n}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr auto",
              gap: 16,
              padding: "14px 16px",
              borderBottom: i < steps.length - 1 ? `1px solid ${COLORS.line}` : "none",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: COLORS.cream,
                border: `1.5px solid ${COLORS.ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_DISPLAY,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              {s.n}
            </div>
            <div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
                {s.title}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                {tr("ferramentas:", "tools:", lang)} {s.tools}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.ink }}>{s.time}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                {s.skill}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DesignDetailView = ({ design, region, onBack, onViewBOM }) => {
  const lang = region === "Brasil" ? "pt" : "en";
  const currency = region === "Brasil" ? "R$" : "US$";
  const price = region === "Brasil" ? design.partsCostBRL : design.partsCostUSD;
  const name = lang === "en" && design.nameEn ? design.nameEn : design.name;
  const skillTr = {
    "Iniciante": tr("Iniciante", "Beginner", lang),
    "Intermediário": tr("Intermediário", "Intermediate", lang),
    "Avançado": tr("Avançado", "Advanced", lang),
  };
  return (
    <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 56px" }}>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: COLORS.muted,
          cursor: "pointer",
          fontFamily: FONT_MONO,
          fontSize: 11,
          padding: 0,
          marginBottom: 20,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <ArrowLeft size={12} /> {tr("Voltar ao catálogo", "Back to catalog", lang)}
      </button>

      {/* Header */}
      <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 32, marginBottom: 40 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <TierBadge tier={design.tier} />
            {design.missionEssential && <MissionBadge />}
            <span
              style={{
                padding: "4px 10px",
                background: "transparent",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 999,
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.inkSoft,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {design.license}
            </span>
          </div>
          <h1
            className="gb-detail-h1"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 56,
              fontWeight: 400,
              color: COLORS.ink,
              margin: "0 0 10px",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {name}
          </h1>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: COLORS.muted,
              marginBottom: 20,
              letterSpacing: "0.03em",
            }}
          >
            {tr("por", "by", lang)} <span style={{ color: COLORS.ink, fontWeight: 500 }}>{design.designer}</span> ·{" "}
            {design.designerLocation}
          </div>
          <p style={{ fontFamily: FONT_SANS, fontSize: 17, lineHeight: 1.55, color: COLORS.inkSoft, margin: 0 }}>
            {pick(design.tagline, lang)}
          </p>
          {design.inspiration && (
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                background: COLORS.cream,
                border: `1px dashed ${COLORS.line}`,
                borderRadius: 3,
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.inkSoft,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Zap size={11} color={COLORS.clay} />
              <span style={{ color: COLORS.muted }}>{tr("Inspirado em:", "Inspired by:", lang)}</span>
              <a
                href={design.inspiration.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: COLORS.ink, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                {design.inspiration.org}
              </a>
            </div>
          )}

          {(() => {
            const warning = getConstraintWarning(design.constraints, region, lang);
            if (!warning) return null;
            const isWarn = warning.severity === "warning";
            return (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: isWarn ? `${COLORS.clay}15` : COLORS.cream,
                  border: `1px solid ${isWarn ? COLORS.clay : COLORS.line}`,
                  borderLeft: `3px solid ${isWarn ? COLORS.clay : COLORS.muted}`,
                  borderRadius: 3,
                  fontFamily: FONT_SANS,
                  fontSize: 13,
                  color: COLORS.ink,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  lineHeight: 1.5,
                }}
              >
                <AlertTriangle
                  size={16}
                  color={isWarn ? COLORS.clay : COLORS.muted}
                  strokeWidth={2}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <span>{warning.text}</span>
              </div>
            );
          })()}

          {/* Specs row */}
          <div
            className="gb-stats-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
              marginTop: 32,
              padding: "20px 0",
              borderTop: `1px solid ${COLORS.line}`,
              borderBottom: `1px solid ${COLORS.line}`,
            }}
          >
            {[
              { label: tr("Custo", "Cost", lang), value: `${currency} ${price}`, sub: tr("materiais", "materials", lang) },
              { label: tr("Tempo", "Time", lang), value: `${design.buildHours}h`, sub: tr("montagem", "assembly", lang) },
              { label: tr("Nível", "Skill", lang), value: skillTr[design.skillTier] || design.skillTier, sub: tr("habilidade", "level", lang) },
              { label: tr("Construído", "Built", lang), value: design.buildCount, sub: tr("vezes", "times", lang) },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    color: COLORS.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 24,
                    fontWeight: 500,
                    color: COLORS.ink,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 3 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Acquisition options */}
          <AcquisitionOptions design={design} region={region} onViewBOM={onViewBOM} />
        </div>

        <div>
          <DesignIllustration design={design} height={340} />
          {/* Designer payout */}
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: COLORS.cream,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {tr("Modelo do projetista", "Designer's model", lang)}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>
                {tr(design.compensation,
                  design.compensation === "Grátis" ? "Free"
                  : design.compensation === "Pay what you want" ? "Pay what you can"
                  : design.compensation === "Royalty / build" ? "Royalty per build"
                  : design.compensation === "Fixed — US$12" ? "Fixed — US$12"
                  : design.compensation,
                  lang)}
              </div>
            </div>
            {design.suggestedBRL > 0 && region === "Brasil" && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>sugerido</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.clay }}>
                  R$ {design.suggestedBRL}
                </div>
              </div>
            )}
            {design.suggestedBRL > 0 && region === "USA" && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>suggested</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.clay }}>
                  US$ {Math.round(design.suggestedBRL / 5)}
                </div>
              </div>
            )}
          </div>
          <GiftPanel design={design} region={region} />
        </div>
      </div>

      {/* Operating range (always visible, compact) */}
      {design.constraints && (
        <OperatingRangePanel constraints={design.constraints} lang={lang} />
      )}

      {/* Content sections */}
      <div style={{ display: "grid", gridTemplateColumns: design.parametric ? "1.5fr 1fr" : "1fr", gap: 24, marginBottom: 32 }}>
        <BuildSteps designId={design.id} />
        {design.parametric && <ParametricPanel design={design} />}
      </div>

      <div style={{ marginBottom: 32 }}>
        <BOMTable region={region} designId={design.id} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <ImprovementsSection designId={design.id} />
      </div>

      {/* Files */}
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: 20 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginBottom: 14 }}>
          {tr("Arquivos estruturados", "Structured files", lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {[
            { name: "tambor-montagem.step", type: tr("CAD 3D", "3D CAD", lang), size: "2.4 MB" },
            { name: "base-estrutura.dxf", type: tr("CAD 2D", "2D CAD", lang), size: "180 KB" },
            { name: "placa-controlador.kicad_pcb", type: "PCB", size: "420 KB" },
            { name: "gerber-v1.2.zip", type: tr("Fabricação", "Fabrication", lang), size: "95 KB" },
            { name: "bom-estruturado.json", type: tr("Lista materiais", "BOM", lang), size: "8 KB" },
            { name: "manifest.okh.yml", type: "Open Know-How", size: "4 KB" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                background: COLORS.cream,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FileText size={16} color={COLORS.muted} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted }}>
                  {f.type} · {f.size}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// BUILDS VIEW
// ============================================================
const BuildCard = ({ build }) => {
  const { lang } = useL();
  const hasSubs = build.substitutions.length > 0;
  const hasWorkarounds = build.workarounds.length > 0;
  return (
    <div
      className="gb-hover-lift"
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 4,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="gb-blueprint"
        style={{
          height: 150,
          background: `linear-gradient(135deg, ${build.accent}22 0%, ${build.accent}44 100%)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ImageIcon size={28} color={build.accent} strokeWidth={1.5} />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: COLORS.inkSoft,
            background: COLORS.paper,
            padding: "3px 7px",
            borderRadius: 2,
            letterSpacing: "0.03em",
          }}
        >
          {tr("FOTO DA CONSTRUÇÃO", "BUILD PHOTO", lang)}
        </div>
        {build.giftedBy && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: COLORS.clay,
              color: COLORS.cream,
              padding: "3px 8px",
              borderRadius: 2,
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <Gift size={9} strokeWidth={2.5} /> {tr("Presente", "Gift", lang)}
          </div>
        )}
      </div>
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {tr("Projeto:", "Design:", lang)} {pick(build.designName, lang) || build.designName}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: COLORS.ink, marginBottom: 2 }}>
          {build.maker}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} />
          {build.location} · {lang === "pt" ? `há ${build.daysAgo}d` : `${build.daysAgo}d ago`}
        </div>

        {/* Structured metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: "10px 0",
            borderTop: `1px dashed ${COLORS.line}`,
            borderBottom: `1px dashed ${COLORS.line}`,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tr("Custo real", "Actual cost", lang)}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, lineHeight: 1.1 }}>
              R$ {build.actualCostBRL}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tr("Pessoa-hora", "Person-hours", lang)}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, lineHeight: 1.1 }}>
              {build.actualHours}h
            </div>
          </div>
        </div>

        <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.45, margin: "0 0 12px" }}>
          "{pick(build.note, lang) || build.note}"
        </p>

        {hasSubs && (
          <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px dashed ${COLORS.line}` }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Replace size={9} /> {tr("Substituições", "Substitutions", lang)} ({build.substitutions.length})
            </div>
            {build.substitutions.map((s, i) => (
              <div key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.4, marginBottom: 4 }}>
                <span style={{ color: COLORS.muted }}>{pick(s.original, lang) || s.original}</span>
                <span style={{ color: COLORS.forest, margin: "0 4px" }}>→</span>
                <span style={{ color: COLORS.ink }}>{pick(s.replaced, lang) || s.replaced}</span>
              </div>
            ))}
          </div>
        )}

        {hasWorkarounds && (
          <div style={{ marginTop: hasSubs ? 8 : "auto", paddingTop: 10, borderTop: `1px dashed ${COLORS.line}` }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.clay, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={9} /> {tr("Contornos", "Workarounds", lang)} ({build.workarounds.length})
            </div>
            {build.workarounds.map((w, i) => (
              <div key={i} style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.4, marginBottom: 4 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>{pick(w.step, lang) || w.step}</div>
                <div>{pick(w.issue, lang) || w.issue} <span style={{ color: COLORS.forest }}>→ {pick(w.fix, lang) || w.fix}</span></div>
              </div>
            ))}
          </div>
        )}

        {build.giftedBy && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: COLORS.cream,
              border: `1px dashed ${COLORS.clay}`,
              borderRadius: 3,
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.clay,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Gift size={11} />
            {tr("Presenteado por", "Gifted by", lang)} <strong>{build.giftedBy}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

const BuildDocumentationForm = () => {
  const { lang } = useL();
  return (
  <div
    style={{
      background: COLORS.cream,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 4,
      padding: 24,
      marginBottom: 32,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          {tr("Documentar sua construção", "Document your build", lang)}
        </div>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: COLORS.ink, margin: 0, letterSpacing: "-0.015em" }}>
          {tr("Campos obrigatórios — para outros makers", "Required fields — for other makers", lang)}
        </h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, fontWeight: 600 }}>
          +50–75 {tr("créditos", "credits", lang)}
        </span>
        <button
          style={{
            padding: "10px 16px",
            background: COLORS.ink,
            color: COLORS.cream,
            border: "none",
            borderRadius: 3,
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Upload size={14} /> {tr("Registrar construção", "Register build", lang)}
        </button>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
      {[
        { icon: DollarSign, label: tr("Custo total (R$)", "Total cost", lang), hint: tr("Inclui substituições e retrabalho", "Includes substitutions and rework", lang), required: true },
        { icon: Clock, label: tr("Pessoa-hora", "Person-hours", lang), hint: tr("Horas de trabalho efetivo", "Effective working hours", lang), required: true },
        { icon: Replace, label: tr("Substituições de material", "Material substitutions", lang), hint: tr("O que não achou? O que usou no lugar?", "What couldn't you find? What did you use instead?", lang), required: false },
        { icon: AlertTriangle, label: tr("Contornos por etapa", "Per-step workarounds", lang), hint: tr("Onde travou e como resolveu", "Where you got stuck and how you fixed it", lang), required: false },
        { icon: ImageIcon, label: tr("Fotos do processo", "Process photos", lang), hint: tr("Mín. 3 fotos: antes, durante, depois", "Min. 3 photos: before, during, after", lang), required: true },
        { icon: MessageCircle, label: tr("Nota para a comunidade", "Community note", lang), hint: tr("O que aprendeu?", "What did you learn?", lang), required: false },
      ].map((f, i) => {
        const Icon = f.icon;
        return (
          <div
            key={i}
            style={{
              padding: 12,
              background: COLORS.paper,
              border: `1px ${f.required ? "solid" : "dashed"} ${COLORS.line}`,
              borderRadius: 3,
              display: "flex",
              gap: 10,
              alignItems: "start",
            }}
          >
            <Icon size={14} color={f.required ? COLORS.clay : COLORS.muted} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5 }}>
                {f.label}
                {f.required && <span style={{ color: COLORS.clay, fontSize: 10 }}>●</span>}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2, lineHeight: 1.4 }}>
                {f.hint}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 14, fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>
      <span style={{ color: COLORS.clay }}>●</span> {tr(
        "obrigatório para que a construção conte para o selo \"Verificado\" do projeto",
        "required for the build to count toward the design's Verified badge",
        lang
      )}
    </div>
  </div>
  );
};

const GiftNoteCard = ({ note }) => {
  const { lang } = useL();
  return (
  <div
    style={{
      background: COLORS.paper,
      border: `1px solid ${COLORS.line}`,
      borderLeft: `4px solid ${COLORS.clay}`,
      borderRadius: 4,
      padding: 18,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <Gift size={12} color={COLORS.clay} />
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {tr("Projeto presenteado", "Gifted design", lang)} · {pick(note.designName, lang) || note.designName}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {tr("De", "From", lang)}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>
          {note.from}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 8 }}>{note.fromLoc}</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, fontStyle: "italic" }}>
          "{pick(note.noteFrom, lang) || note.noteFrom}"
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {tr("Para", "To", lang)}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>
          {note.to}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 8 }}>{note.toLoc}</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, fontStyle: "italic" }}>
          "{pick(note.noteTo, lang) || note.noteTo}"
        </div>
      </div>
    </div>
  </div>
  );
};

const BuildsView = () => {
  const { lang } = useL();
  return (
  <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 28px 56px" }}>
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
        {tr("Quem construiu · Quem usou", "Who built · Who used", lang)}
      </div>
      <h1 className="gb-page-h1" style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 400, color: COLORS.ink, margin: 0, letterSpacing: "-0.02em" }}>
        {tr("Construções da comunidade.", "Community builds.", lang)}
      </h1>
      <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.inkSoft, marginTop: 12, maxWidth: 620, lineHeight: 1.5 }}>
        {tr(
          "Cada construção é documentada com dados estruturados — custo real, tempo, substituições. É assim que um projeto ganha o selo Verificado, e como outras pessoas sabem no que se meter.",
          "Every build is documented with structured data — actual cost, time, substitutions. That's how a design earns its Verified badge, and how others know what they're getting into.",
          lang
        )}
      </p>
    </div>

    <BuildDocumentationForm />

    {/* Gift notes */}
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Gift size={12} />
        {tr("Presentes recentes · notas entre makers", "Recent gifts · notes between makers", lang)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {GIFT_NOTES.map((n, i) => (
          <GiftNoteCard key={i} note={n} />
        ))}
      </div>
    </div>

    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
      {tr("Todas as construções", "All builds", lang)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
      {BUILDS.map((b) => (
        <BuildCard key={b.id} build={b} />
      ))}
    </div>
  </div>
  );
};

// ============================================================
// FABRICATORS VIEW
// ============================================================
const FabricatorsView = () => {
  const { lang } = useL();
  return (
  <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 28px 56px" }}>
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
        {tr("Makerspaces · Oficinas · Fab Labs", "Makerspaces · Workshops · Fab Labs", lang)}
      </div>
      <h1 className="gb-page-h1" style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 400, color: COLORS.ink, margin: 0, letterSpacing: "-0.02em" }}>
        {tr("Não tem o equipamento? ", "Don't have the tools? ", lang)}
        <em style={{ color: COLORS.clay, fontWeight: 500 }}>
          {tr("Use o do bairro.", "Use the neighborhood's.", lang)}
        </em>
      </h1>
      <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.inkSoft, marginTop: 12, maxWidth: 620, lineHeight: 1.5 }}>
        {tr(
          "Reserve tempo em makerspaces locais ou contrate fabricantes para partes específicas — corte a laser, impressão 3D, solda.",
          "Book time at local makerspaces or hire fabricators for specific parts — laser cutting, 3D printing, welding.",
          lang
        )}
      </p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
      {FABRICATORS.map((f) => (
        <div
          key={f.name}
          className="gb-hover-lift"
          style={{
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500, color: COLORS.ink }}>
                {f.name}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} /> {f.city}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: COLORS.ink, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={14} fill={COLORS.ochre} stroke={COLORS.ochre} /> {f.rating}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted }}>{f.jobs} jobs</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "12px 0" }}>
            {(pick(f.equipment, lang) || f.equipment).map((e) => (
              <span
                key={e}
                style={{
                  padding: "3px 8px",
                  background: COLORS.cream,
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 2,
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: COLORS.inkSoft,
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTop: `1px dashed ${COLORS.line}`,
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.ink, fontWeight: 600 }}>
              {pick(f.rate, lang) || f.rate}
            </span>
            <button
              style={{
                padding: "6px 12px",
                background: COLORS.ink,
                color: COLORS.cream,
                border: "none",
                borderRadius: 3,
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {tr("Reservar", "Book", lang)}
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

// ============================================================
// SUBMIT VIEW
// ============================================================
const SubmitView = () => {
  const { lang } = useL();
  const [step, setStep] = useState(0);
  const checkItems = [
    { label: tr("Arquivos CAD em formatos abertos (STEP, DXF, KiCad)", "CAD files in open formats (STEP, DXF, KiCad)", lang), done: true },
    { label: tr("BOM estruturada (JSON/CSV, não PDF)", "Structured BOM (JSON/CSV, not PDF)", lang), done: true },
    { label: tr("Cada item resolve para fornecedor ou categoria de material", "Each item resolves to a supplier or material category", lang), done: true },
    { label: tr("Manifesto Open Know-How (.okh.yml)", "Open Know-How manifest (.okh.yml)", lang), done: true },
    { label: tr("Etapas de construção com dependências e tempo estimado", "Build steps with dependencies and time estimates", lang), done: true },
    { label: tr("Pelo menos uma construção verificada documentada", "At least one documented verified build", lang), done: false },
    { label: tr("Licença de código aberto declarada", "Open-source license declared", lang), done: true },
    { label: tr("Avisos de segurança para categorias certificadas", "Safety warnings for Certified categories", lang), done: false },
  ];
  const compensationModels = [
    { id: "free", label: tr("Grátis", "Free", lang), desc: tr("Livre para baixar e usar", "Free to download and use", lang) },
    { id: "pwyw", label: tr("Pague o que puder", "Pay what you can", lang), desc: tr("Valor sugerido, o maker decide", "Suggested price, maker decides", lang) },
    { id: "fixed", label: tr("Preço fixo", "Fixed price", lang), desc: tr("Valor único pelos arquivos", "One-time fee for the files", lang) },
    { id: "royalty", label: tr("Royalty por construção", "Royalty per build", lang), desc: tr("% sobre cada lote de materiais", "% of each BOM purchase", lang) },
    { id: "sub", label: tr("Assinatura", "Subscription", lang), desc: tr("Patreon-style; apoio recorrente", "Patreon-style; recurring support", lang) },
    { id: "bounty", label: tr("Comissão", "Bounty", lang), desc: tr("Comunidade financia; você desenvolve", "Community funds; you develop", lang) },
  ];
  const [selectedModel, setSelectedModel] = useState("pwyw");

  return (
    <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 28px 56px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          {tr("Publicar um projeto", "Publish a design", lang)}
        </div>
        <h1 className="gb-page-h1" style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 400, color: COLORS.ink, margin: 0, letterSpacing: "-0.02em" }}>
          {tr("Estrutura primeiro. ", "Structure first. ", lang)}
          <em style={{ color: COLORS.clay, fontWeight: 500 }}>
            {tr("Reproduzível sempre.", "Reproducible always.", lang)}
          </em>
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.inkSoft, marginTop: 12, maxWidth: 620, lineHeight: 1.5 }}>
          {tr(
            "Projetos no Gambiarra precisam ser reconstruíveis por qualquer pessoa com as máquinas certas e uma loja de ferragens próxima. Validamos isso antes da publicação.",
            "Designs on Gambiarra must be rebuildable by anyone with the right machines and a nearby hardware store. We validate this before publishing.",
            lang
          )}
        </p>
      </div>

      <div className="gb-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        {/* Validation checklist */}
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>
            {tr("Checagem estrutural", "Structural check", lang)}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 20 }}>
            {tr("6 de 8 requisitos cumpridos", "6 of 8 requirements met", lang)}
          </div>
          {checkItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "start",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < checkItems.length - 1 ? `1px dashed ${COLORS.line}` : "none",
              }}
            >
              {item.done ? (
                <CheckCircle2 size={18} color={COLORS.forest} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertTriangle size={18} color={COLORS.clay} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 13,
                  color: item.done ? COLORS.inkSoft : COLORS.clay,
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: COLORS.cream,
              border: `1px dashed ${COLORS.line}`,
              borderRadius: 3,
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.muted,
              lineHeight: 1.5,
            }}
          >
            {tr("Projetos em categorias", "Designs in categories", lang)}{" "}
            <span style={{ color: COLORS.forest, fontWeight: 600 }}>
              {tr("Certificadas", "Certified", lang)}
            </span>{" "}
            {tr(
              "(rede elétrica, água potável, dispositivos médicos) exigem documentação de certificação terceirizada. A responsabilidade é do projetista.",
              "(mains power, potable water, medical devices) require third-party certification documentation. The designer is responsible.",
              lang
            )}
          </div>
        </div>

        {/* Compensation model picker */}
        <div>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>
              {tr("Modelo de compensação", "Compensation model", lang)}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 14 }}>
              {tr("Escolha por projeto · pode variar entre versões", "Choose per design · can vary across versions", lang)}
            </div>
            {compensationModels.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  marginBottom: 5,
                  background: selectedModel === m.id ? COLORS.ochre : COLORS.cream,
                  border: `1px solid ${selectedModel === m.id ? COLORS.ochre : COLORS.line}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: selectedModel === m.id ? COLORS.inkSoft : COLORS.muted,
                    marginTop: 2,
                  }}
                >
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          <button
            className="gb-btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              background: COLORS.ink,
              color: COLORS.cream,
              border: "none",
              borderRadius: 3,
              fontFamily: FONT_SANS,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: 0.5,
            }}
            disabled
          >
            <Upload size={16} />
            {tr("Publicar projeto", "Publish design", lang)}
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {tr("(complete os requisitos)", "(complete requirements)", lang)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SPLASH VIEW — role selector
// ============================================================
const SplashView = ({ setView }) => {
  const { lang } = useL();

  const roles = [
    {
      id: "customer",
      icon: ShoppingBag,
      title: tr("Cliente", "Customer", lang),
      tagline: tr("Quero um produto.", "I want a product.", lang),
      sub: tr(
        "Encontre no catálogo. Escolha plantas, kit ou contratar um maker. Se não existe ainda, faça um pedido pra comunidade.",
        "Find it in the catalog. Pick plans, a kit, or hire a maker. If it doesn't exist yet, post a request.",
        lang
      ),
      destLabel: tr("Ver catálogo", "Browse catalog", lang),
      route: "catalog",
      accent: COLORS.clay,
    },
    {
      id: "maker",
      icon: Hammer,
      title: tr("Maker", "Maker", lang),
      tagline: tr("Quero construir — pra mim ou pra outros.", "I want to build — for myself or for hire.", lang),
      sub: tr(
        "Explore o catálogo pra achar o que construir. Documente suas construções pra ganhar reputação e aceitar trabalhos.",
        "Browse the catalog to find what to build. Document your builds to earn reputation and take on jobs.",
        lang
      ),
      destLabel: tr("Ver construções", "See builds", lang),
      route: "builds",
      accent: COLORS.forest,
      // Maker is the one role with two natural destinations.
      secondaryLabel: tr("Catálogo", "Catalog", lang),
      secondaryRoute: "catalog",
    },
    {
      id: "designer",
      icon: Briefcase,
      title: tr("Projetista", "Designer", lang),
      tagline: tr("Tenho projetos pra compartilhar.", "I have designs to share.", lang),
      sub: tr(
        "Publique projetos abertos e estruturados. Escolha seu modelo de compensação. Aceite melhorias da comunidade.",
        "Publish structured open designs. Pick your compensation model. Accept community improvements.",
        lang
      ),
      destLabel: tr("Publicar projeto", "Publish a design", lang),
      route: "submit",
      accent: COLORS.forestSoft,
    },
    {
      id: "fabricator",
      icon: Factory,
      title: tr("Fabricante", "Fabricator", lang),
      tagline: tr("Tenho um makerspace ou equipamento.", "I run a makerspace or own equipment.", lang),
      sub: tr(
        "Cadastre seu espaço, ferramentas e preços. Pegue trabalhos de corte, impressão, solda e montagem.",
        "List your space, tools, and rates. Take on cutting, printing, welding, and assembly jobs.",
        lang
      ),
      destLabel: tr("Cadastrar espaço", "List your space", lang),
      route: "fabricators",
      accent: COLORS.inkSoft,
    },
    {
      id: "supplier",
      icon: Store,
      title: tr("Fornecedor", "Supplier", lang),
      tagline: tr("Vendo materiais ou peças.", "I sell materials or parts.", lang),
      sub: tr(
        "Conecte seu inventário existente (eBay, Mercado Livre, Digi-Key) ou cadastre itens manualmente. Makers compram direto de você.",
        "Connect your existing inventory (eBay, Mercado Livre, Digi-Key) or list items manually. Makers buy directly from you.",
        lang
      ),
      destLabel: tr("Cadastrar inventário", "Register inventory", lang),
      route: "suppliers",
      accent: COLORS.ochre,
    },
  ];

  return (
    <div
      className="gb-fade-in gb-splash-pad"
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "64px 28px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto" }}>
        {/* Intro */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.clay,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {tr("· Projetos abertos · Materiais locais ·", "· Open designs · Local materials ·", lang)}
          </div>
          <h1
            className="gb-splash-h1"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 76,
              fontWeight: 400,
              color: COLORS.ink,
              margin: "0 0 18px",
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
            }}
          >
            {tr("Quem é você, ", "Who are you, ", lang)}
            <em style={{ color: COLORS.clay, fontWeight: 500 }}>
              {tr("hoje?", "today?", lang)}
            </em>
          </h1>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: 17,
              lineHeight: 1.5,
              color: COLORS.inkSoft,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {tr(
              "Diferentes pessoas precisam de coisas diferentes na Gambiarra. Comece pelo seu caminho — você pode mudar depois.",
              "Different people need different things on Gambiarra. Start with your path — you can switch later.",
              lang
            )}
          </p>
        </div>

        {/* Role grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => {
                  if (!role.disabled && role.route) setView(role.route);
                }}
                role="button"
                tabIndex={role.disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!role.disabled && role.route && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setView(role.route);
                  }
                }}
                className={role.disabled ? "" : "gb-hover-lift"}
                style={{
                  background: COLORS.paper,
                  border: `1px solid ${COLORS.line}`,
                  borderTop: `3px solid ${role.accent}`,
                  borderRadius: 4,
                  padding: "22px 22px 18px",
                  cursor: role.disabled ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  opacity: role.disabled ? 0.6 : 1,
                  minHeight: 220,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 3,
                      background: role.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={COLORS.cream} strokeWidth={2} />
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 24,
                      fontWeight: 500,
                      color: COLORS.ink,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {role.title}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 15,
                    fontWeight: 600,
                    color: COLORS.ink,
                    lineHeight: 1.3,
                    marginTop: 4,
                  }}
                >
                  {role.tagline}
                </div>

                <p
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: COLORS.inkSoft,
                    lineHeight: 1.5,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {role.sub}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 12,
                    marginTop: 6,
                    borderTop: `1px dashed ${COLORS.line}`,
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: role.disabled ? COLORS.muted : role.accent,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  <span>{role.destLabel} {!role.disabled && "→"}</span>
                  {role.secondaryRoute && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setView(role.secondaryRoute);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setView(role.secondaryRoute);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        color: COLORS.inkSoft,
                        borderBottom: `1px dotted ${COLORS.muted}`,
                        paddingBottom: 1,
                        cursor: "pointer",
                      }}
                    >
                      {tr("ou", "or", lang)} {role.secondaryLabel} →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary link */}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button
            onClick={() => setView("catalog")}
            style={{
              background: "none",
              border: "none",
              color: COLORS.muted,
              fontFamily: FONT_MONO,
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 4,
              padding: 0,
            }}
          >
            {tr("ou só dá uma olhada no catálogo →", "or just browse the catalog →", lang)}
          </button>
        </div>
      </div>
    </div>
  );
};


const Footer = () => {
  const { lang } = useL();
  return (
  <footer
    style={{
      borderTop: `1px solid ${COLORS.line}`,
      padding: "40px 28px",
      marginTop: 40,
      background: COLORS.paperDark,
    }}
  >
    <div
      className="gb-footer-grid"
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 40,
      }}
    >
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500, fontStyle: "italic", color: COLORS.clay, marginBottom: 8 }}>
          Gambiarra
        </div>
        <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.muted, lineHeight: 1.5, maxWidth: 360, margin: 0 }}>
          {tr(
            "Plataforma aberta de projetos de hardware construídos com materiais ubíquos.",
            "Open platform for hardware designs built with ubiquitous materials.",
            lang
          )}
        </p>
      </div>
      {[
        {
          h: tr("Plataforma", "Platform", lang),
          items: [
            tr("Catálogo", "Catalog", lang),
            tr("Construções", "Builds", lang),
            tr("Makerspaces", "Makerspaces", lang),
            tr("Publicar", "Publish", lang),
          ],
        },
        {
          h: tr("Comunidade", "Community", lang),
          items: [
            tr("Diretrizes", "Guidelines", lang),
            tr("Fórum", "Forum", lang),
            tr("Eventos", "Events", lang),
            tr("Parceiros", "Partners", lang),
          ],
        },
        {
          h: tr("Legal", "Legal", lang),
          items: [
            tr("Licenças", "Licenses", lang),
            tr("Responsabilidade", "Liability", lang),
            tr("Segurança", "Safety", lang),
            tr("Contato", "Contact", lang),
          ],
        },
      ].map((col) => (
        <div key={col.h}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            {col.h}
          </div>
          {col.items.map((item) => (
            <div
              key={item}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.inkSoft,
                marginBottom: 5,
                cursor: "pointer",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  </footer>
  );
};

// ============================================================
// CREDITS VIEW
// ============================================================
const CreditsView = ({ credits, setView }) => {
  const { lang } = useL();

  const earnWays = [
    {
      icon: Camera,
      credits: 50,
      title: tr("Documentar uma construção", "Document a build", lang),
      desc: tr(
        "Registre custo real, horas, fotos das etapas, e quaisquer substituições que você fez.",
        "Post actual cost, hours, step photos, and any substitutions you made.",
        lang
      ),
      bonus: tr("+25 para fotos de cada etapa", "+25 for step-by-step photos", lang),
      accent: COLORS.ochre,
      cta: tr("Documentar →", "Document →", lang),
      route: "builds",
    },
    {
      icon: GitPullRequest,
      credits: "100–500",
      title: tr("Propor uma melhoria", "Submit an improvement", lang),
      desc: tr(
        "Pull request em CAD, BOM, ou instruções. Aceito pela manutenção, créditos liberados.",
        "Pull request to CAD, BOM, or instructions. Approved by maintainer, credits release.",
        lang
      ),
      bonus: tr("+300 para fix de segurança", "+300 for a safety fix", lang),
      accent: COLORS.forest,
      cta: tr("Ver projetos →", "Browse designs →", lang),
      route: "catalog",
    },
    {
      icon: Users,
      credits: 200,
      title: tr("Ensinar um novo maker", "Teach a new maker", lang),
      desc: tr(
        "Guie alguém pela primeira construção dele. Ele confirma. Vocês dois ganham créditos.",
        "Walk someone through their first build. They confirm. You both earn credits.",
        lang
      ),
      bonus: tr("+100 se iniciante, +100 para iniciante", "+100 for beginner, +100 for the beginner", lang),
      accent: COLORS.clay,
      cta: tr("Virar mentor →", "Become a mentor →", lang),
      route: "fabricators",
    },
    {
      icon: Store,
      credits: 25,
      title: tr("Adicionar fornecedor", "Add a supplier", lang),
      desc: tr(
        "Encontrou uma peça da BOM num fornecedor local que não estava listado? Adiciona e ganha crédito.",
        "Found a BOM part at a local supplier that wasn't listed? Add it and earn.",
        lang
      ),
      bonus: tr("+10 se mais barato", "+10 if it's cheaper", lang),
      accent: COLORS.forestSoft,
      cta: tr("Ver BOMs →", "Browse BOMs →", lang),
      route: "catalog",
    },
    {
      icon: Globe,
      credits: "100+",
      title: tr("Traduzir um projeto", "Translate a design", lang),
      desc: tr(
        "Traduza instruções, BOM e descrições para outro idioma. Créditos por página.",
        "Translate instructions, BOM, and descriptions into another language. Per page.",
        lang
      ),
      bonus: tr("+50 para revisão de falante nativo", "+50 for native-speaker review", lang),
      accent: COLORS.ochre,
      cta: tr("Ver projetos →", "Browse designs →", lang),
      route: "catalog",
    },
    {
      icon: Calendar,
      credits: "500+",
      title: tr("Organizar um workshop", "Host a workshop", lang),
      desc: tr(
        "Sábado de construção no makerspace ou escola local. 5+ participantes. Fotos e lista de presença.",
        "Saturday build at a makerspace or local school. 5+ participants. Photos and attendance list.",
        lang
      ),
      bonus: tr("+50 por participante acima de 5", "+50 per attendee over 5", lang),
      accent: COLORS.clay,
      cta: tr("Cadastrar makerspace →", "Register a space →", lang),
      route: "fabricators",
    },
  ];

  const activity = [
    {
      date: tr("há 2 dias", "2 days ago", lang),
      text: tr("Construção documentada: Kit Iluminação 12V", "Build documented: 12V Lighting Kit", lang),
      amount: 50,
    },
    {
      date: tr("há 1 semana", "1 week ago", lang),
      text: tr("PR aceito: substituto para controlador PWM", "PR merged: PWM controller substitute", lang),
      amount: 150,
    },
    {
      date: tr("há 2 semanas", "2 weeks ago", lang),
      text: tr("Ensinou Dona Teresa (Manaus) a montar", "Taught Dona Teresa (Manaus) to build", lang),
      amount: 200,
    },
    {
      date: tr("há 3 semanas", "3 weeks ago", lang),
      text: tr("Fornecedor adicionado: Tigre (Leroy Merlin Recife)", "Supplier added: Tigre (Leroy Merlin Recife)", lang),
      amount: 25,
    },
    {
      date: tr("há 1 mês", "1 month ago", lang),
      text: tr("Aplicado no Kit Filtro AguaClara", "Applied to AguaClara Filter Kit", lang),
      amount: -180,
    },
  ];

  const creditValueBRL = 0.5; // 1 credit ≈ R$ 0.50
  const creditValueUSD = 0.1; // 1 credit ≈ US$ 0.10

  return (
    <div className="gb-fade-in gb-section-pad" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 56px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.clay, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          {tr("Contribuir é uma forma de pagar", "Contributing is a way of paying", lang)}
        </div>
        <h1 className="gb-page-h1" style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 400, color: COLORS.ink, margin: 0, letterSpacing: "-0.02em" }}>
          {tr("Créditos. ", "Credits. ", lang)}
          <em style={{ color: COLORS.clay, fontWeight: 500 }}>
            {tr("Outra moeda.", "Another currency.", lang)}
          </em>
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.inkSoft, marginTop: 12, maxWidth: 640, lineHeight: 1.5 }}>
          {tr(
            "Se você não pode pagar em dinheiro, pague em trabalho. Documentar construções, propor melhorias, ensinar outros — tudo isso gera créditos que valem como dinheiro na plataforma.",
            "If you can't pay in cash, pay with work. Documenting builds, proposing improvements, teaching others — all of it earns credits that spend like money on the platform.",
            lang
          )}
        </p>
      </div>

      {/* Balance + value */}
      <div
        className="gb-stack-mobile"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            background: COLORS.paper,
            border: `2px solid ${COLORS.clay}`,
            borderRadius: 4,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: COLORS.clay,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Award size={28} color={COLORS.cream} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
              {tr("Saldo atual", "Current balance", lang)}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 500, color: COLORS.ink, lineHeight: 1 }}>
              {credits} <span style={{ fontSize: 20, color: COLORS.muted, fontWeight: 400 }}>{tr("créditos", "credits", lang)}</span>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
              ≈ R$ {(credits * creditValueBRL).toFixed(0)} · US$ {(credits * creditValueUSD).toFixed(0)}
            </div>
          </div>
        </div>
        <div
          style={{
            background: COLORS.cream,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            padding: 18,
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            {tr("Como usar", "How to use", lang)}
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.7 }}>
            <li>{tr("Cobrem até 50% de um kit ou contratação", "Cover up to 50% of a kit or hire", lang)}</li>
            <li>{tr("100% da compensação do projetista (pay-what-you-can)", "100% of designer compensation (pay-what-you-can)", lang)}</li>
            <li>{tr("100% das taxas de plataforma", "100% of platform fees", lang)}</li>
            <li>{tr("Não expiram nem se acumulam com dinheiro", "Don't expire or stack with cash", lang)}</li>
          </ul>
        </div>
      </div>

      {/* Ways to earn */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.clay,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {tr("Formas de ganhar", "Ways to earn", lang)}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {earnWays.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.title}
                onClick={() => w.route && setView(w.route)}
                className="gb-hover-lift"
                style={{
                  background: COLORS.paper,
                  border: `1px solid ${COLORS.line}`,
                  borderTop: `3px solid ${w.accent}`,
                  borderRadius: 4,
                  padding: 18,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 3,
                      background: w.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={COLORS.cream} strokeWidth={2} />
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 22,
                      fontWeight: 600,
                      color: COLORS.clay,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{w.credits}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 17,
                    fontWeight: 600,
                    color: COLORS.ink,
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}
                >
                  {w.title}
                </div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {w.desc}
                </p>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: COLORS.forest,
                    marginTop: 4,
                  }}
                >
                  {w.bonus}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: w.accent,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    paddingTop: 10,
                    borderTop: `1px dashed ${COLORS.line}`,
                  }}
                >
                  {w.cta}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.muted,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {tr("Atividade recente", "Recent activity", lang)}
        </div>
        <div
          style={{
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {activity.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 18px",
                borderBottom: i < activity.length - 1 ? `1px solid ${COLORS.line}` : "none",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>
                  {a.text}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                  {a.date}
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  fontWeight: 600,
                  color: a.amount >= 0 ? COLORS.forest : COLORS.clay,
                  whiteSpace: "nowrap",
                }}
              >
                {a.amount >= 0 ? "+" : ""}{a.amount} {tr("crd", "crd", lang)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [view, setView] = useState("splash");
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [region, setRegion] = useState("Brasil");
  const [credits, setCredits] = useState(127); // mock credit balance
  const lang = region === "Brasil" ? "pt" : "en";

  const handleSelectDesign = (design) => {
    setSelectedDesign(design);
    setView("design");
  };

  const handleBack = () => {
    setView("catalog");
    setSelectedDesign(null);
  };

  return (
    <LangContext.Provider value={{ lang, region }}>
      <CreditsContext.Provider value={{ credits, setCredits }}>
      <div
        className="gb-grain"
        style={{
          minHeight: "100vh",
          background: COLORS.paper,
          color: COLORS.ink,
          fontFamily: FONT_SANS,
        }}
      >
        <GlobalStyles />
        <Header view={view} setView={setView} region={region} setRegion={setRegion} credits={credits} />
        {view === "splash" && <SplashView setView={setView} />}
        {view === "catalog" && <CatalogView onSelectDesign={handleSelectDesign} region={region} />}
        {view === "design" && selectedDesign && (
          <DesignDetailView design={selectedDesign} region={region} onBack={handleBack} onViewBOM={() => {}} />
        )}
        {view === "builds" && <BuildsView />}
        {view === "requests" && <RequestsView />}
        {view === "fabricators" && <FabricatorsView />}
        {view === "submit" && <SubmitView />}
        {view === "credits" && <CreditsView credits={credits} setView={setView} />}
        {view !== "splash" && <Footer />}
      </div>
      </CreditsContext.Provider>
    </LangContext.Provider>
  );
}
