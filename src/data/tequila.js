// The tequila and mezcal shelf, by category. One source for the /menu
// "Tequila & Mezcal" cards and the /tequila-bar category tabs, so a bottle is
// added or removed in one place (PAGE-TEMPLATES rule 14). Bottle counts are
// computed from `bottles`, never typed. `age` is the barrel stat on
// /tequila-bar; null hides that box (mezcal is not graded by barrel time).
export const TEQUILA = [
  {
    id: 'blanco', tab: 'Blanco', menuName: 'Blancos',
    description: 'Aged 0 to 60 days. Fresh, slightly sweet, silver in color. Best in margaritas.',
    age: '0 to 60 days',
    bottles: ['1800', 'Avión', 'Casamigos', 'Casa Noble', 'Clase Azul', 'Don Julio', 'El Jimador', 'Espolón', 'Herradura', 'Hornitos', 'Lobos 1707', 'Milagro Select', 'Patrón Silver', '1942 Alma Miel'],
  },
  {
    id: 'reposado', tab: 'Reposado', menuName: 'Reposados',
    description: 'Aged 2 to 12 months in casks or bourbon barrels. Hints of vanilla, oak, café and nuts.',
    age: '2 to 12 months',
    bottles: ['1800', 'Casamigos', 'Clase Azul', 'Don Julio', 'El Jimador', 'Espolón', 'Herradura', 'Hornitos', 'Milagro Select', 'Patrón', 'Tequila Ocho', '1942 Primavera', '1942 Rosado'],
  },
  {
    id: 'anejo', tab: 'Añejo', menuName: 'Añejos',
    description: 'Aged 1 to 3 years in oak. Rich and smooth, butterscotch and caramel.',
    age: '1 to 3 years',
    bottles: ['Casamigos', 'Don Julio', 'Don Julio 1942', 'Herradura', 'Patrón'],
  },
  {
    id: 'extra-anejo', tab: 'Extra Añejo', menuName: 'Extra Añejos',
    description: 'Aged 3+ years in small oak barrels. Dark and smooth, like brandy; meant for sipping.',
    age: '3+ years',
    bottles: ['Avión Reserva 44', 'Clase Azul Ultra'],
  },
  {
    id: 'mezcal', tab: 'Mezcal', menuName: 'Mezcal',
    description: 'Roasted agave, full-bodied and smoky.',
    age: null,
    bottles: ['Casamigos', 'El Silencio Espadín', 'Montelobos Joven', 'Ilegal Joven', 'Ilegal Reposado', 'Ilegal Añejo'],
  },
];

export const tequilaById = Object.fromEntries(TEQUILA.map((c) => [c.id, c]));

/** The /menu card line: description, then the bottles. */
export const menuLine = (c) => `${c.description} ${c.bottles.join(', ')}.`;
