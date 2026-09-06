import { Match } from '../types';

export const SATURDAY_SAMPLE_MATCHES: Match[] = [
  {
    id: 'm-sat-1',
    twizzitId: 'tw-94101',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '10u00',
    homeTeam: 'D-Mon U10G-1',
    awayTeam: 'Baudouin',
    displayMatchText: 'U10G-1 - Baudouin',
    category: 'U10',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  {
    id: 'm-sat-2',
    twizzitId: 'tw-94102',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '11u00',
    homeTeam: 'D-Mon U11G-3',
    awayTeam: 'Constantia',
    displayMatchText: 'U11G-3 - Constantia',
    category: 'U11',
    isHome: true,
    field: 'Veld 1A',
    status: 'scheduled'
  },
  {
    id: 'm-sat-3',
    twizzitId: 'tw-94103',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '11u00',
    homeTeam: 'D-Mon U12G-1',
    awayTeam: 'Indiana',
    displayMatchText: 'U12G-1 - Indiana',
    category: 'U12',
    isHome: true,
    field: 'Veld 1B',
    status: 'scheduled'
  },
  {
    id: 'm-sat-4',
    twizzitId: 'tw-94104',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '12u15',
    homeTeam: 'D-Mon U14B-1',
    awayTeam: 'Merode',
    displayMatchText: 'U14B-1 - Merode',
    category: 'U14',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  {
    id: 'm-sat-5',
    twizzitId: 'tw-94105',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '13u45',
    homeTeam: 'D-Mon U16G-1',
    awayTeam: 'Hermes',
    displayMatchText: 'U16G-1 - Hermes',
    category: 'U16',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  {
    id: 'm-sat-6',
    twizzitId: 'tw-94106',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '15u30',
    homeTeam: 'D-Mon U19B-1',
    awayTeam: 'Lokeren',
    displayMatchText: 'U19B-1 - Lokeren',
    category: 'U19',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  // Away match example to show the filter works!
  {
    id: 'm-sat-7',
    twizzitId: 'tw-94107',
    day: 'Saturday',
    dateStr: 'Za 5 september',
    time: '14u00',
    homeTeam: 'Gantoise',
    awayTeam: 'D-Mon U14G-1',
    displayMatchText: 'Gantoise - U14G-1',
    category: 'U14',
    isHome: false,
    field: 'Gantoise Pitch 3 (Gent)',
    status: 'scheduled'
  }
];

export const SUNDAY_SAMPLE_MATCHES: Match[] = [
  {
    id: 'm-sun-1',
    twizzitId: 'tw-94201',
    day: 'Sunday',
    dateStr: 'Zo 6 september',
    time: '10u00',
    homeTeam: 'D-Mon U8B-1',
    awayTeam: 'Victory',
    displayMatchText: 'U8B-1 - Victory',
    category: 'U8',
    isHome: true,
    field: 'Veld 2',
    status: 'scheduled'
  },
  {
    id: 'm-sun-2',
    twizzitId: 'tw-94202',
    day: 'Sunday',
    dateStr: 'Zo 6 september',
    time: '11u30',
    homeTeam: 'D-Mon U14G-2',
    awayTeam: 'Beveren',
    displayMatchText: 'U14G-2 - Beveren',
    category: 'U14',
    isHome: true,
    field: 'Veld 1',
    status: 'scheduled'
  },
  {
    id: 'm-sun-3',
    twizzitId: 'tw-94203',
    day: 'Sunday',
    dateStr: 'Zo 6 september',
    time: '14u30',
    homeTeam: 'D-Mon Heren 1',
    awayTeam: 'Mechelse',
    displayMatchText: 'Heren 1 - Mechelse',
    category: 'Heren',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  {
    id: 'm-sun-4',
    twizzitId: 'tw-94204',
    day: 'Sunday',
    dateStr: 'Zo 6 september',
    time: '16u15',
    homeTeam: 'D-Mon Dames 1',
    awayTeam: 'Antwerp',
    displayMatchText: 'Dames 1 - Antwerp',
    category: 'Dames',
    isHome: true,
    field: 'Veld 1 (Waterveld)',
    status: 'scheduled'
  },
  // Away match example
  {
    id: 'm-sun-5',
    twizzitId: 'tw-94205',
    day: 'Sunday',
    dateStr: 'Zo 6 september',
    time: '15u00',
    homeTeam: 'Dragons',
    awayTeam: 'D-Mon Heren 2',
    displayMatchText: 'Dragons - Heren 2',
    category: 'Heren',
    isHome: false,
    field: 'Brasschaat Pitch 1',
    status: 'scheduled'
  }
];

export const ALL_INITIAL_FIXTURES: Match[] = [
  ...SATURDAY_SAMPLE_MATCHES,
  ...SUNDAY_SAMPLE_MATCHES
];
