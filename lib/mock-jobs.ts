export interface JobDetail {
  id: string;
  title: string;
  categoryId: string;
  city: string;
  postedAt: string;
  status: "abierto" | "cerrado";
  description?: string;
  clientName: string;
  clientPhone: string;
  applicants?: number;
}

export const MOCK_JOBS: JobDetail[] = [
  {
    id: "1",
    title: "Arreglar canilla que gotea en el baño",
    categoryId: "plomeria",
    city: "Buenos Aires",
    postedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "abierto",
    description:
      "La canilla del baño principal gotea constantemente desde hace una semana. Necesito alguien que venga a revisar y reemplazar las piezas que hagan falta. Tengo acceso todo el día.",
    clientName: "Marcelo R.",
    clientPhone: "1134567890",
    applicants: 0,
  },
  {
    id: "2",
    title: "Cambiar tomacorriente quemado en la cocina",
    categoryId: "electricidad",
    city: "Córdoba",
    postedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "abierto",
    description:
      "El tomacorriente de la mesada de la cocina se quemó. Necesito alguien de confianza que lo reemplace. Tengo los materiales.",
    clientName: "Laura M.",
    clientPhone: "3514567890",
    applicants: 3,
  },
  {
    id: "3",
    title: "Limpieza profunda departamento 3 ambientes",
    categoryId: "limpieza",
    city: "Rosario",
    postedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "cerrado",
    description:
      "Necesito limpieza profunda de un departamento de 3 ambientes antes de entregarlo. Incluye cocina, baño y pisos.",
    clientName: "Diego F.",
    clientPhone: "3414567890",
    applicants: 7,
  },
  {
    id: "4",
    title: "Pintar living y comedor, 40m²",
    categoryId: "pintura",
    city: "Buenos Aires",
    postedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: "abierto",
    description:
      "Necesito pintar living y comedor, aproximadamente 40m². Color a definir, pero claro. Tengo escalera.",
    clientName: "Valeria G.",
    clientPhone: "1145678901",
    applicants: 2,
  },
  {
    id: "5",
    title: "Reparar pared con humedad en dormitorio",
    categoryId: "albanileria",
    city: "Mendoza",
    postedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    status: "cerrado",
    description:
      "Hay una mancha de humedad en la pared del dormitorio principal. Necesito que la reparen y quede lista para pintar.",
    clientName: "Carlos T.",
    clientPhone: "2614567890",
    applicants: 1,
  },
  {
    id: "6",
    title: "Poda de árboles y mantenimiento de jardín",
    categoryId: "jardineria",
    city: "Buenos Aires",
    postedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    status: "abierto",
    description:
      "Jardín de casa con 3 árboles que necesitan poda y canteros con malezas. Trabajo de medio día aproximadamente.",
    clientName: "Sofía R.",
    clientPhone: "1156789012",
    applicants: 4,
  },
];

export function getJobById(id: string): JobDetail | undefined {
  return MOCK_JOBS.find((j) => j.id === id);
}
