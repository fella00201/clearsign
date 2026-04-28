// Extracted from clearsign-v3.html

export const CATS = {
  rental: {
    label: 'Rentals',
    icon: '🏠',
    badge: 'b-rental',
    sub: {
      room:    { label: 'Room / Apartment', desc: 'Private room or flat' },
      parking: { label: 'Parking spot',     desc: 'Car or motorbike space' },
      storage: { label: 'Storage unit',     desc: 'Garage, shed, locker' },
      venue:   { label: 'Venue / Space',    desc: 'Hall, garden, studio' },
      gear:    { label: 'Equipment / Gear', desc: 'Tools, cameras, trailers' },
    },
  },
  service: {
    label: 'Services',
    icon: '👶',
    badge: 'b-service',
    sub: {
      babysit:  { label: 'Babysitting / Nanny', desc: 'Childcare' },
      cleaning: { label: 'Cleaning',            desc: 'Home or office' },
      tutoring: { label: 'Tutoring',            desc: 'Academic coaching' },
      petcare:  { label: 'Pet sitting',         desc: 'Animal care' },
      handyman: { label: 'Handyman',            desc: 'Repairs and tasks' },
    },
  },
  sale: {
    label: 'Sales & Loans',
    icon: '💰',
    badge: 'b-sale',
    sub: {
      car:      { label: 'Car / Vehicle',     desc: 'Private car, van' },
      goods:    { label: 'Goods / Furniture', desc: 'Items for sale' },
      loan:     { label: 'Personal loan',     desc: 'Lending money' },
      freelance:{ label: 'Freelance work',    desc: 'Project contract' },
    },
  },
  seek: {
    label: 'Seeking',
    icon: '🔍',
    badge: 'b-seek',
    sub: {
      seek_room:     { label: 'Looking for a room', desc: 'Need somewhere to live' },
      seek_babysit:  { label: 'Need a babysitter',  desc: 'Childcare help' },
      seek_cleaning: { label: 'Need a cleaner',     desc: 'Cleaning service' },
      seek_parking:  { label: 'Need parking',       desc: 'Looking for a spot' },
      seek_tutor:    { label: 'Need a tutor',       desc: 'Teaching help' },
    },
  },
};

export const TAGS = {
  // RENTAL
  room: {
    label: 'Room', color: '#1e3d6e', text: '#7eb8ff',
    tags: ['Furnished','Unfurnished','Bills included','Bills excluded','En-suite bathroom','Shared bathroom','Garden access','Parking included','Pet friendly','No pets','Couples welcome','Single only','Short term','Long term','Student friendly','Professional preferred','Quiet household','Social household','Near transit','City centre','Near university','Ground floor','Top floor','Recently renovated'],
  },
  parking: {
    label: 'Parking', color: '#1e3d6e', text: '#7eb8ff',
    tags: ['Covered','Outdoor','Gated','24/7 access','CCTV','EV charger','Motorbike ok','Large vehicle','Near city centre','Near station','Monthly','Weekly','Daily available'],
  },
  storage: {
    label: 'Storage', color: '#1e3d6e', text: '#7eb8ff',
    tags: ['Dry','Climate controlled','24/7 access','Ground floor','Drive-up access','CCTV','Alarmed','Shelving included','Small unit','Medium unit','Large unit','Key fob access'],
  },
  venue: {
    label: 'Venue', color: '#1e3d6e', text: '#7eb8ff',
    tags: ['Outdoor','Indoor','Garden','Kitchen access','AV equipment','Tables & chairs','Parking on site','Wheelchair accessible','Alcohol permitted','Catering allowed','Up to 20 guests','Up to 50 guests','Up to 100 guests','Photography','Events','Workshops'],
  },
  gear: {
    label: 'Gear rental', color: '#1e3d6e', text: '#7eb8ff',
    tags: ['Camera','Lenses','Lighting','Audio','Tripod','Drone','Power tools','Garden tools','Trailer','Van','Bike','Deposit required','Insurance available','Delivery available','Pickup only'],
  },
  // SERVICES
  babysit: {
    label: 'Childcare', color: '#3a1528', text: '#ff7eb3',
    tags: ['CRB checked','First aid certified','Babies (0–1)','Toddlers (1–3)','Young children (3–8)','Pre-teens (8–12)','Teenagers','Overnight stays','School pickup','After school','Weekdays','Weekends','Evenings only','Live-in available','Own transport','Speaks Spanish','Speaks French','Cooking included','Light housework','Regular booking','One-off ok','Nanny experience','Au pair experience'],
  },
  cleaning: {
    label: 'Cleaning', color: '#3a1528', text: '#ff7eb3',
    tags: ['Own equipment','Own products','Eco products','End of tenancy','Regular clean','One-off','Deep clean','Ironing','Laundry','Oven cleaning','Window cleaning','Office cleaning','Insured','References available','Weekdays','Weekends','Evenings'],
  },
  tutoring: {
    label: 'Tutoring', color: '#3a1528', text: '#ff7eb3',
    tags: ['Maths','English','Science','Physics','Chemistry','Biology','History','Languages','Music','Art','Primary level','GCSE','A-Level','SAT/ACT','University level','In-person','Online','Home visits','Group sessions','1-to-1','Exam prep','Degree educated','Qualified teacher'],
  },
  petcare: {
    label: 'Pet care', color: '#3a1528', text: '#ff7eb3',
    tags: ['Dog walking','Cat sitting','Dog boarding','Home visits','Overnight stays','Small dogs','Large dogs','Cats','Rabbits','Birds','Own home','Your home','Insured','Vet trained','Daily updates','GPS tracked','Multiple pets ok'],
  },
  handyman: {
    label: 'Handyman', color: '#3a1528', text: '#ff7eb3',
    tags: ['Plumbing','Electrical','Painting','Decorating','Carpentry','Flat-pack assembly','Tiling','Flooring','Garden','Pressure washing','Gutter cleaning','Insured','Qualified','Same day available','Free quote','Materials included','Emergency callouts'],
  },
  // SALES & LOANS
  car: {
    label: 'Vehicle sale', color: '#3a2a08', text: '#f5a623',
    tags: ['Low mileage','Full service history','One owner','MOT valid','Tax included','Manual','Automatic','Petrol','Diesel','Electric','Hybrid','New tyres','Finance available','Part exchange','ULEZ compliant','Negotiable price','Urgent sale'],
  },
  goods: {
    label: 'Goods sale', color: '#3a2a08', text: '#f5a623',
    tags: ['As new','Good condition','Fair condition','Original packaging','Warranty remaining','Collection only','Can post','Negotiable','Bundle deal','Urgent sale','Receipt included','Electronics','Furniture','Clothing','Books','Garden','Sports','Baby items','Musical instruments'],
  },
  loan: {
    label: 'Personal loan', color: '#3a2a08', text: '#f5a623',
    tags: ['Interest free','Low interest','Flexible repayment','Lump sum repayment','Monthly instalments','Short term','Long term','Friends','Family','Colleagues','Receipt included','Written agreement'],
  },
  freelance: {
    label: 'Freelance', color: '#3a2a08', text: '#f5a623',
    tags: ['Design','Development','Writing','Photography','Video','Marketing','Social media','SEO','Consulting','Accounting','Legal','Translation','Music','Architecture','Remote','On-site','Fixed price','Hourly rate','Deposit required','Portfolio available','Quick turnaround','Revisions included'],
  },
  // SEEKING
  seek_room: {
    label: 'Seeking room', color: '#0c2018', text: '#3ecf7a',
    tags: ['Furnished preferred','Unfurnished ok','Bills included preferred','Long term','Short term','Student','Professional','Non-smoker','No pets','Pet owner','Early mover','LGBTQ+ friendly','Quiet household','Social ok','Own bathroom preferred','Couple seeking','Single person','Near city centre','Near transit','Near university','References available','Guarantor available'],
  },
  seek_babysit: {
    label: 'Seeking childcare', color: '#0c2018', text: '#3ecf7a',
    tags: ['Regular booking','One-off','Evenings','Weekdays','Weekends','School pickup needed','After school','Overnight stays','Babies','Toddlers','Young children','Pre-teens','Two kids','Three kids','CRB required','First aid required','Driver needed','Own home','Your home'],
  },
  seek_cleaning: {
    label: 'Seeking cleaner', color: '#0c2018', text: '#3ecf7a',
    tags: ['Weekly','Fortnightly','One-off','Deep clean','End of tenancy','Eco products preferred','Own equipment needed','Small flat','Large house','Office','References required','Insured required','Weekdays','Weekends','Evenings'],
  },
  seek_parking: {
    label: 'Seeking parking', color: '#0c2018', text: '#3ecf7a',
    tags: ['Covered preferred','Outdoor ok','Long term','Monthly','Weekly','Near city centre','Near station','Near workplace','EV charging needed','Large vehicle','Motorbike','Immediate start','Gated preferred'],
  },
  seek_tutor: {
    label: 'Seeking tutor', color: '#0c2018', text: '#3ecf7a',
    tags: ['Maths','English','Science','Languages','Music','Art','Primary level','GCSE','A-Level','SAT/ACT','Online preferred','In-person preferred','Home visits','1-to-1','Exam prep','Qualified teacher preferred','Flexible hours','Weekends ok'],
  },
};

export const ALL_POPULAR_TAGS = [
  'Furnished', 'Bills included', 'Pet friendly', 'Near transit', 'Long term',
  'Short term', 'CRB checked', 'First aid certified', 'Eco products',
  'Own equipment', 'Insured', 'References available', 'Online', 'In-person',
  'Negotiable', 'Immediate start', 'Weekends', 'Evenings', 'Deposit required',
  'Quick turnaround',
];
