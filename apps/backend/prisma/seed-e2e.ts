import { ReservationStatus } from '../src/generated/prisma/enums.js'
import { prisma } from './lib/prisma.js';
import bcrypt from 'bcryptjs'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function randDate(start: Date, end: Date): Date { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())) }
function fmtDate(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function genPhone(): string { return `+48 ${randInt(500,799)} ${randInt(100,999)} ${randInt(100,999)}` }
function genEmail(fn: string, ln: string, i: number): string {
  const d = ['gmail.com','wp.pl','o2.pl','interia.pl','onet.pl']
  return `${fn.toLowerCase().replace(/ł/g,'l').replace(/ś/g,'s').replace(/ż/g,'z').replace(/ź/g,'z').replace(/ą/g,'a').replace(/ę/g,'e').replace(/ó/g,'o').replace(/ń/g,'n').replace(/ć/g,'c')}.${ln.toLowerCase().replace(/ł/g,'l').replace(/ś/g,'s').replace(/ż/g,'z').replace(/ź/g,'z').replace(/ą/g,'a').replace(/ę/g,'e').replace(/ó/g,'o').replace(/ń/g,'n').replace(/ć/g,'c')}.${String(i).padStart(3,'0')}@${rand(d)}`
}

const FIRST_M = ['Jan','Piotr','Andrzej','Tomasz','Krzysztof','Marek','Michał','Adam','Paweł','Bartosz','Jakub','Mateusz','Kamil','Łukasz','Wojciech','Robert','Damian','Grzegorz','Rafał','Sebastian']
const FIRST_F = ['Anna','Maria','Katarzyna','Małgorzata','Agnieszka','Barbara','Ewa','Joanna','Magdalena','Monika','Aleksandra','Natalia','Karolina','Justyna','Weronika','Patrycja','Sylwia','Dorota','Izabela','Beata']
const LAST = ['Kowalski','Nowak','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Dąbrowski','Kozłowski','Jankowski','Mazur','Kwiatkowski','Krawczyk','Piotrowski','Grabowski','Pawlak','Michalski']

const NOTES_POOL = [
  'Klient stały, zawsze punktualny',
  'Preferuje kontakt telefoniczny',
  'Polecony przez rodzinę Nowaków',
  'Prosi o menu wegetariańskie',
  'Alergia na orzechy - ważne!',
  'VIP - stały klient od 2023',
  'Preferuje salę z kominkiem',
  'Organizuje eventy firmowe regularnie',
  null, null, null, null, null, null,
]

// ═══════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════

const HALLS = [
  { name: 'Sala Kryształowa', capacity: 80, pricePerPerson: 250, pricePerChild: 175, pricePerToddler: 0, description: 'Elegancka sala z kryształowymi żyrandolami', amenities: ['Klimatyzacja','Parkiet'], images: [] },
  { name: 'Sala Taneczna', capacity: 120, pricePerPerson: 280, pricePerChild: 196, pricePerToddler: 0, description: 'Przestronna sala z parkietem tanecznym', amenities: ['Parkiet','Nagłośnienie'], images: [] },
  { name: 'Sala Złota', capacity: 150, pricePerPerson: 320, pricePerChild: 224, pricePerToddler: 0, description: 'Reprezentacyjna sala ze złotymi zdobieniami', amenities: ['Scena','Oświetlenie LED'], images: [] },
  { name: 'Cały obiekt', capacity: 300, pricePerPerson: 400, pricePerChild: 280, pricePerToddler: 0, description: 'Wynajem całego obiektu na ekskluzywne wydarzenia', amenities: ['Wszystkie sale','Ogród','Parking'], images: [] },
  { name: 'Strzecha 1', capacity: 50, pricePerPerson: 200, pricePerChild: 140, pricePerToddler: 0, description: 'Kameralna sala w stylu rustykalnym', amenities: ['Kominek','Drewniane wnętrze'], images: [] },
  { name: 'Strzecha 2', capacity: 60, pricePerPerson: 220, pricePerChild: 154, pricePerToddler: 0, description: 'Druga sala w stylu wiejskim z kominkiem', amenities: ['Kominek','Taras'], images: [] },
]

const EVENT_TYPES = [
  { name: 'Wesele', description: 'Uroczystość weselna z przyjęciem', color: '#FF69B4' },
  { name: 'Urodziny', description: 'Przyjęcie urodzinowe', color: '#FFA500' },
  { name: 'Rocznica/Jubileusz', description: 'Rocznica ślubu lub jubileusz', color: '#FFD700' },
  { name: 'Komunia', description: 'Pierwsza Komunia Święta', color: '#87CEEB' },
  { name: 'Chrzest/Roczek', description: 'Chrzest lub pierwsze urodziny dziecka', color: '#98FB98' },
  { name: 'Stypa', description: 'Stypa pogrzebowa', color: '#696969' },
  { name: 'Inne', description: 'Inne rodzaje wydarzeń', color: '#9370DB' },
]

// ═══════════════════════════════════════════════════════════════
// DISH CATEGORIES & DISHES
// ═══════════════════════════════════════════════════════════════

const DISH_CATEGORIES = [
  { slug: 'przystawki', name: 'Przystawki', icon: '🥗', color: '#22c55e', displayOrder: 1 },
  { slug: 'zupy', name: 'Zupy', icon: '🍲', color: '#f97316', displayOrder: 2 },
  { slug: 'dania-glowne', name: 'Dania główne', icon: '🥩', color: '#ef4444', displayOrder: 3 },
  { slug: 'dodatki', name: 'Dodatki', icon: '🥔', color: '#a855f7', displayOrder: 4 },
  { slug: 'salatki', name: 'Sałatki', icon: '🥬', color: '#10b981', displayOrder: 5 },
  { slug: 'desery', name: 'Desery', icon: '🍰', color: '#ec4899', displayOrder: 6 },
  { slug: 'sery-wedliny', name: 'Sery i wędliny', icon: '🧀', color: '#f59e0b', displayOrder: 7 },
  { slug: 'napoje', name: 'Napoje', icon: '🍹', color: '#06b6d4', displayOrder: 8 },
  { slug: 'dania-dzieciece', name: 'Dania dla dzieci', icon: '🍕', color: '#8b5cf6', displayOrder: 9 },
  { slug: 'torty', name: 'Torty', icon: '🎂', color: '#f43f5e', displayOrder: 10 },
]

const DISHES_BY_CATEGORY: Record<string, { name: string; description?: string; allergens?: string[] }[]> = {
  'przystawki': [
    { name: 'Tatar wołowy klasyczny', description: 'Świeży tatar z polędwicy wołowej z żółtkiem i dodatkami', allergens: ['jaja'] },
    { name: 'Carpaccio z polędwicy', description: 'Cienko krojona polędwica z rukolą i parmezanem', allergens: ['mleko'] },
    { name: 'Roladki z łososia wędzonego', description: 'Z serkiem śmietankowym i kaparami', allergens: ['ryby','mleko'] },
    { name: 'Bruschetta z pomidorami', description: 'Grillowany chleb z pomidorami, bazylią i oliwą', allergens: ['gluten'] },
    { name: 'Krewetki w tempurze', description: 'Chrupiące krewetki z sosem słodko-kwaśnym', allergens: ['skorupiaki','gluten'] },
    { name: 'Pasztet z gęsi domowy', description: 'Tradycyjny pasztet z żurawiną', allergens: ['jaja'] },
    { name: 'Śledź w oleju z cebulką', description: 'Klasyczny śledź po polsku', allergens: ['ryby'] },
    { name: 'Śledź w śmietanie', description: 'Delikatny śledź z jabłkiem i cebulką', allergens: ['ryby','mleko'] },
    { name: 'Antipasti włoskie', description: 'Suszone pomidory, oliwki, karczochy, mozzarella', allergens: ['mleko'] },
    { name: 'Galaretka drobiowa', description: 'Domowa galaretka z kurczaka z warzywami' },
    { name: 'Jajka faszerowane', description: 'Połówki jajek z pastą łososiową', allergens: ['jaja','ryby'] },
    { name: 'Koreczki caprese', description: 'Mozzarella, pomidor, bazylia na szpadce', allergens: ['mleko'] },
    { name: 'Paté z kaczki z konfiturą figową', description: 'Wyrafinowana przystawka z dżemem figowym' },
    { name: 'Roladki z szynki parmeńskiej', description: 'Z gruszką i serem gorgonzola', allergens: ['mleko'] },
    { name: 'Tartinki z avocado', description: 'Pieczywo z kremem z avocado i jajkiem', allergens: ['gluten','jaja'] },
    { name: 'Hummus z warzywami', description: 'Klasyczny hummus z paluszkami warzywnymi', allergens: ['sezam'] },
    { name: 'Vitello tonnato', description: 'Cielęcina w sosie tuńczykowym', allergens: ['ryby','jaja'] },
    { name: 'Terrina z warzyw', description: 'Kolorowa terrina z sezonowych warzyw' },
    { name: 'Kuleczki serowe z żurawiną', description: 'Panierowane kulki serowe', allergens: ['mleko','gluten'] },
    { name: 'Roladki z bakłażana', description: 'Z ricottą i suszonymi pomidorami', allergens: ['mleko'] },
  ],
  'zupy': [
    { name: 'Rosół z kury z domowym makaronem', description: 'Tradycyjny rosół na kurczaku z marchewką', allergens: ['gluten','jaja'] },
    { name: 'Żurek na zakwasie', description: 'Z białą kiełbasą i jajkiem', allergens: ['gluten','jaja'] },
    { name: 'Krem z dyni z pestkami', description: 'Aksamitny krem z pieczonej dyni', allergens: ['mleko'] },
    { name: 'Zupa borowikowa', description: 'Aromatyczna zupa z prawdziwków z łazankami', allergens: ['gluten'] },
    { name: 'Pomidorowa z ryżem', description: 'Klasyczna zupa pomidorowa ze śmietanką', allergens: ['mleko'] },
    { name: 'Krem z brokułów', description: 'Delikatny krem z grzankami', allergens: ['mleko','gluten'] },
    { name: 'Barszcz czerwony z uszkami', description: 'Tradycyjny barszcz z uszkami z grzybami', allergens: ['gluten'] },
    { name: 'Zupa cebulowa gratinowana', description: 'Z grzanką i serem gruyère', allergens: ['gluten','mleko'] },
    { name: 'Chłodnik litewski', description: 'Zimna zupa buraczkowa z kefiru', allergens: ['mleko'] },
    { name: 'Krem szparagowy', description: 'Z białych szparagów z truflą', allergens: ['mleko'] },
    { name: 'Zupa grzybowa z łazankami', description: 'Z mieszanki grzybów leśnych', allergens: ['gluten'] },
    { name: 'Zupa rybna', description: 'Z dorsza i warzyw korzeniowych', allergens: ['ryby'] },
    { name: 'Krem z selera z jabłkiem', description: 'Lekki krem z chrupiącym boczkiem' },
    { name: 'Zupa ogórkowa', description: 'Tradycyjna z ziemniakami i koperkiem', allergens: ['mleko'] },
    { name: 'Consommé wołowe', description: 'Klarowny bulion z kluseczkami', allergens: ['gluten','jaja'] },
  ],
  'dania-glowne': [
    { name: 'Polędwica wołowa Wellington', description: 'W cieście francuskim z duxelles', allergens: ['gluten','jaja','mleko'] },
    { name: 'Kaczka pieczona z jabłkami', description: 'Ćwiartka kaczki z sosem pomarańczowym' },
    { name: 'Łosoś na parze z warzywami', description: 'Z masłem cytrynowym i szparagami', allergens: ['ryby','mleko'] },
    { name: 'Schab faszerowany śliwką', description: 'Z sosem grzybowym i ziemniakami', allergens: ['mleko'] },
    { name: 'Zrazy wołowe zawijane', description: 'Z ogórkiem i boczkiem w sosie własnym', allergens: ['gluten'] },
    { name: 'Filet z kurczaka w ziołach', description: 'Grillowany z warzywami sezonowymi' },
    { name: 'Medaliony wieprzowe', description: 'Z sosem z zielonego pieprzu', allergens: ['mleko'] },
    { name: 'Dorsz na maśle szałwiowym', description: 'Z puree z pietruszki', allergens: ['ryby','mleko'] },
    { name: 'Pierś z kaczki sous-vide', description: 'Z sosem wiśniowym i kluskami', allergens: ['gluten'] },
    { name: 'Comber jagnięcy', description: 'Z rozmarynem i miodową glazurą' },
    { name: 'Rolada z indyka', description: 'Z nadzieniem szpinakowym i serem', allergens: ['mleko'] },
    { name: 'Kotlet de volaille', description: 'Klasyczny z masłem ziołowym', allergens: ['gluten','jaja','mleko'] },
    { name: 'Stek wołowy ribeye', description: 'Grillowany z masłem czosnkowym 300g', allergens: ['mleko'] },
    { name: 'Golonka pieczona', description: 'Chrupiąca ze startym chrzanem' },
    { name: 'Pierogi z mięsem', description: 'Domowe z sosem grzybowym', allergens: ['gluten','jaja'] },
    { name: 'Risotto z borowikami', description: 'Kremowe z parmezanem', allergens: ['mleko'] },
    { name: 'Roladki drobiowe', description: 'Z szynką parmeńską i mozzarellą', allergens: ['mleko'] },
    { name: 'Żeberka BBQ', description: 'Wolno pieczone w sosie barbecue' },
    { name: 'Sandacz smażony', description: 'Na maśle z migdałami', allergens: ['ryby','mleko','orzechy'] },
    { name: 'Ossobuco po mediolańsku', description: 'Duszone golenie cielęce z gremolata' },
    { name: 'Kurczak po tajsku', description: 'Z mlekiem kokosowym i warzywami', allergens: ['skorupiaki'] },
    { name: 'Pstrąg pieczony w całości', description: 'Z cytryną i ziołami', allergens: ['ryby'] },
    { name: 'Klopsiki szwedzkie', description: 'W sosie śmietanowym z brusnicą', allergens: ['gluten','mleko'] },
    { name: 'Pieczeń rzymska', description: 'Tradycyjna z sosem chrzanowym', allergens: ['gluten','jaja'] },
    { name: 'Befsztyk tatarski premium', description: 'Z polędwicy wołowej Black Angus', allergens: ['jaja'] },
  ],
  'dodatki': [
    { name: 'Ziemniaki pieczone z rozmarynem', description: 'Chrupiące z ziołami' },
    { name: 'Ziemniaki puree', description: 'Kremowe z masłem i muszkatołowcem', allergens: ['mleko'] },
    { name: 'Ryż jaśminowy', description: 'Sypki z masłem' },
    { name: 'Kluski śląskie', description: 'Tradycyjne z dziurką', allergens: ['gluten','jaja'] },
    { name: 'Kasza gryczana', description: 'Prażona z cebulką' },
    { name: 'Warzywa grillowane', description: 'Cukinia, papryka, bakłażan, szparagi' },
    { name: 'Kopytka', description: 'Domowe z masłem', allergens: ['gluten','jaja','mleko'] },
    { name: 'Frytki truflowe', description: 'Z parmezanem i truflą', allergens: ['mleko'] },
    { name: 'Buraczki zasmażane', description: 'Tradycyjne z chrzanem' },
    { name: 'Krokiety z grzybami', description: 'Panierowane z sosem', allergens: ['gluten','jaja'] },
    { name: 'Bukiet surówek', description: 'Trzy rodzaje surówek sezonowych' },
    { name: 'Warzywa na parze', description: 'Brokuł, kalafior, marchew z masłem', allergens: ['mleko'] },
    { name: 'Kluski z makiem', description: 'Tradycyjne na słodko', allergens: ['gluten','jaja'] },
    { name: 'Pyzy z mięsem', description: 'Ziemniaczane z nadzieniem', allergens: ['gluten'] },
    { name: 'Makaron penne', description: 'Z masłem i ziołami', allergens: ['gluten','mleko'] },
  ],
  'salatki': [
    { name: 'Sałatka Cezar', description: 'Z grillowanym kurczakiem i grzankami', allergens: ['gluten','jaja','mleko','ryby'] },
    { name: 'Sałatka grecka', description: 'Z fetą, oliwkami i pomidorami', allergens: ['mleko'] },
    { name: 'Sałatka z buraczków', description: 'Z kozim serem i orzechami', allergens: ['mleko','orzechy'] },
    { name: 'Coleslaw', description: 'Kremowy z kapusty i marchewki', allergens: ['jaja'] },
    { name: 'Sałatka z rukolą', description: 'Z parmezanem, pomidorkami i balsamico', allergens: ['mleko'] },
    { name: 'Sałatka waldorf', description: 'Z jabłkiem, selerem i orzechami', allergens: ['orzechy','mleko'] },
    { name: 'Sałatka z quinoa', description: 'Z awokado, pomidorem i kolendrą' },
    { name: 'Sałatka z grillowanymi warzywami', description: 'Z dressingiem miodowo-musztardowym' },
    { name: 'Sałatka nicejska', description: 'Z tuńczykiem, jajkiem i fasolką', allergens: ['ryby','jaja'] },
    { name: 'Tabbouleh', description: 'Z kuskusem, miętą i cytryną', allergens: ['gluten'] },
    { name: 'Sałatka z mango i krewetkami', description: 'Egzotyczna z sosem limonkowym', allergens: ['skorupiaki'] },
    { name: 'Sałatka jarzynowa', description: 'Tradycyjna polska z majonezem', allergens: ['jaja'] },
  ],
  'desery': [
    { name: 'Tiramisu klasyczne', description: 'Z mascarpone i kawą', allergens: ['jaja','mleko','gluten'] },
    { name: 'Sernik nowojorski', description: 'Kremowy na kruchym spodzie', allergens: ['jaja','mleko','gluten'] },
    { name: 'Panna cotta', description: 'Z sosem malinowym', allergens: ['mleko'] },
    { name: 'Lody rzemieślnicze 3 smaki', description: 'Wanilia, czekolada, pistacja', allergens: ['mleko','orzechy'] },
    { name: 'Szarlotka ciepła', description: 'Z lodami waniliowymi i karmelem', allergens: ['gluten','jaja','mleko'] },
    { name: 'Crème brûlée', description: 'Klasyczny z wanilią bourbon', allergens: ['jaja','mleko'] },
    { name: 'Brownie czekoladowe', description: 'Z sosem malinowym i bitą śmietaną', allergens: ['gluten','jaja','mleko'] },
    { name: 'Ptysie z kremem', description: 'Klasyczne z kremem waniliowym', allergens: ['gluten','jaja','mleko'] },
    { name: 'Mousse czekoladowy', description: 'Z ciemnej czekolady 70%', allergens: ['mleko','jaja'] },
    { name: 'Tarta z owocami sezonowymi', description: 'Na kruchym spodzie z kremem', allergens: ['gluten','jaja','mleko'] },
    { name: 'Deser pavlova', description: 'Beza z bitą śmietaną i owocami', allergens: ['jaja','mleko'] },
    { name: 'Budyń waniliowy z karmelem', description: 'Domowy z sosem toffi', allergens: ['mleko'] },
    { name: 'Makaroniki francuskie', description: 'Mix smaków (6 sztuk)', allergens: ['jaja','mleko','orzechy'] },
    { name: 'Fondant czekoladowy', description: 'Z płynnym środkiem', allergens: ['gluten','jaja','mleko'] },
    { name: 'Profiteroles z czekoladą', description: 'Ptysie z lodami i polewą', allergens: ['gluten','jaja','mleko'] },
  ],
  'sery-wedliny': [
    { name: 'Deska serów polskich', description: 'Oscypek, bundz, ser kozi, ser pleśniowy', allergens: ['mleko'] },
    { name: 'Deska serów europejskich', description: 'Brie, camembert, gorgonzola, manchego', allergens: ['mleko'] },
    { name: 'Wędliny tradycyjne', description: 'Szynka, kiełbasa myśliwska, kabanosy' },
    { name: 'Wędliny premium', description: 'Prosciutto, bresaola, salami milano' },
    { name: 'Deska mięs i serów', description: 'Mix wędlin i serów na dużej desce', allergens: ['mleko'] },
    { name: 'Tatar z łososia', description: 'Z kaparami i szalotką', allergens: ['ryby'] },
    { name: 'Pasta z tuńczyka', description: 'Z oliwkami i suszonymi pomidorami', allergens: ['ryby'] },
    { name: 'Hummus trio', description: 'Klasyczny, buraczkowy, z pieczoną papryką', allergens: ['sezam'] },
    { name: 'Antipasti na desce', description: 'Oliwki, karczochy, suszone pomidory, grissini', allergens: ['gluten'] },
    { name: 'Focaccia z rozmarynem', description: 'Własna z oliwą z oliwek', allergens: ['gluten'] },
  ],
  'napoje': [
    { name: 'Lemoniada cytrynowa', description: 'Domowa z miętą' },
    { name: 'Lemoniada malinowa', description: 'Ze świeżymi malinami' },
    { name: 'Kompot z jabłek i gruszek', description: 'Tradycyjny, lekko słodzony' },
    { name: 'Kawa espresso/cappuccino', description: 'Z ekspresu ciśnieniowego', allergens: ['mleko'] },
    { name: 'Herbata premium', description: 'Wybór herbat liściastych' },
    { name: 'Woda mineralna', description: 'Gazowana i niegazowana 0.5L' },
    { name: 'Sok pomarańczowy świeży', description: 'Wyciskany na miejscu' },
    { name: 'Smoothie owocowe', description: 'Banan, truskawka, mango', allergens: ['mleko'] },
    { name: 'Herbata mrożona', description: 'Brzoskwiniowa lub cytrynowa' },
    { name: 'Gorąca czekolada', description: 'Z prawdziwej czekolady z bitą śmietaną', allergens: ['mleko'] },
  ],
  'dania-dzieciece': [
    { name: 'Nuggetsy z kurczaka', description: 'Panierowane z frytkami', allergens: ['gluten','jaja'] },
    { name: 'Mini pizza margherita', description: 'Z mozzarellą i bazylią', allergens: ['gluten','mleko'] },
    { name: 'Paluszki rybne', description: 'Z sosem tatarskim i frytkami', allergens: ['ryby','gluten'] },
    { name: 'Makaron z sosem pomidorowym', description: 'Penne z łagodnym sosem', allergens: ['gluten'] },
    { name: 'Kotlet schabowy mini', description: 'Z puree ziemniaczanym', allergens: ['gluten','jaja'] },
    { name: 'Naleśniki z nutellą', description: 'Cienkie z czekoladą i owocami', allergens: ['gluten','jaja','mleko','orzechy'] },
    { name: 'Pierożki ruskie mini', description: 'Z masłem i koperkiem', allergens: ['gluten','jaja','mleko'] },
    { name: 'Zupa pomidorowa z makaronem', description: 'Łagodna wersja dla dzieci', allergens: ['gluten','mleko'] },
  ],
  'torty': [
    { name: 'Tort weselny piętrowy', description: '3 piętra, do 150 osób, do uzgodnienia smak', allergens: ['gluten','jaja','mleko'] },
    { name: 'Tort urodzinowy klasyczny', description: 'Biszkopt z kremem śmietanowym i owocami', allergens: ['gluten','jaja','mleko'] },
    { name: 'Tort komunijny', description: 'Biały z dekoracją religijną', allergens: ['gluten','jaja','mleko'] },
    { name: 'Tort czekoladowy', description: 'Ciemna czekolada z ganache', allergens: ['gluten','jaja','mleko'] },
    { name: 'Tort owocowy', description: 'Lekki biszkopt ze świeżymi owocami sezonowymi', allergens: ['gluten','jaja','mleko'] },
    { name: 'Naked cake', description: 'Modny tort bez lukru z kwiatami jadalnymi', allergens: ['gluten','jaja','mleko'] },
    { name: 'Tort bezowy', description: 'Beza z kremem mascarpone i malinami', allergens: ['jaja','mleko'] },
    { name: 'Tort red velvet', description: 'Klasyczny z kremem cheese frosting', allergens: ['gluten','jaja','mleko'] },
  ],
}

// ═══════════════════════════════════════════════════════════════
// ADDON GROUPS
// ═══════════════════════════════════════════════════════════════

const ADDON_GROUPS = [
  { name: 'Bar alkoholowy open', description: 'Pełen bar z obsługą barmana', minSelect: 0, maxSelect: 1, priceType: 'PER_PERSON', basePrice: 120, icon: '🍸', displayOrder: 1 },
  { name: 'Strefa chill outdoor', description: 'Meble ogrodowe, lampy, koce', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 2500, icon: '🌿', displayOrder: 2 },
  { name: 'Fotobudka', description: 'Fotobudka z rekwizytami i wydrukami', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 1800, icon: '📸', displayOrder: 3 },
  { name: 'Dekoracje kwiatowe premium', description: 'Dekoracja sali żywymi kwiatami', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 3500, icon: '💐', displayOrder: 4 },
  { name: 'DJ i oprawa muzyczna', description: 'Profesjonalny DJ z nagłośnieniem', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 3000, icon: '🎵', displayOrder: 5 },
  { name: 'Candy bar', description: 'Słodki stół z ciasteczkami i słodyczami', minSelect: 0, maxSelect: 1, priceType: 'PER_PERSON', basePrice: 45, icon: '🍬', displayOrder: 6 },
  { name: 'Fontanna czekoladowa', description: 'Z owocami i pralinkami do maczania', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 800, icon: '🍫', displayOrder: 7 },
  { name: 'Pokaz barmański', description: 'Show flair bartending 30min', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 1500, icon: '🎪', displayOrder: 8 },
  { name: 'Owoce morza live station', description: 'Stacja z ostrykami, krewetkami i krabem', minSelect: 0, maxSelect: 1, priceType: 'PER_PERSON', basePrice: 85, icon: '🦐', displayOrder: 9 },
  { name: 'Strefa kids z animatorem', description: 'Animator dla dzieci + atrakcje', minSelect: 0, maxSelect: 1, priceType: 'FLAT', basePrice: 1200, icon: '🎈', displayOrder: 10 },
]

// ═══════════════════════════════════════════════════════════════
// MENU TEMPLATES, PACKAGES & OPTIONS
// ═══════════════════════════════════════════════════════════════

interface TemplateConfig {
  eventTypeName: string
  name: string
  variant?: string
  description: string
  packages: { name: string; description: string; pricePerAdult: number; pricePerChild: number; pricePerToddler: number; color: string; icon: string; badgeText?: string; isPopular?: boolean; isRecommended?: boolean; includedItems: string[] }[]
}

const MENU_TEMPLATES: TemplateConfig[] = [
  {
    eventTypeName: 'Wesele', name: 'Menu Weselne 2026', variant: 'standard', description: 'Kompletne menu weselne na sezon 2026',
    packages: [
      { name: 'Standard', description: 'Tradycyjne menu weselne', pricePerAdult: 250, pricePerChild: 175, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['3 przystawki','Zupa do wyboru','Danie główne','2 dodatki','Tort weselny'] },
      { name: 'Premium', description: 'Rozszerzone menu z dodatkowymi daniami', pricePerAdult: 320, pricePerChild: 224, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Popularny', isPopular: true, includedItems: ['5 przystawek','2 zupy','2 dania główne','3 dodatki','Deska serów','Tort weselny','Candy bar'] },
      { name: 'VIP', description: 'Ekskluzywne menu all-inclusive', pricePerAdult: 400, pricePerChild: 280, pricePerToddler: 0, color: '#d97706', icon: 'Diamond', badgeText: 'VIP', isRecommended: true, includedItems: ['8 przystawek','2 zupy','3 dania główne','4 dodatki','Deska serów i wędlin','Tort weselny','Candy bar','Fontanna czekoladowa','Open bar'] },
    ]
  },
  {
    eventTypeName: 'Wesele', name: 'Menu Weselne Letnie', variant: 'letnie', description: 'Lekkie menu weselne na lato z grilla',
    packages: [
      { name: 'Letni Standard', description: 'Lekkie dania letnie', pricePerAdult: 260, pricePerChild: 182, pricePerToddler: 0, color: '#059669', icon: 'Sun', includedItems: ['4 przystawki','Chłodnik','Danie z grilla','Sałatki','Tort'] },
      { name: 'Letni Premium', description: 'Rozszerzone menu letnie z BBQ', pricePerAdult: 340, pricePerChild: 238, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Hit lata', isPopular: true, includedItems: ['6 przystawek','2 zupy letnie','2 dania z grilla','Sałatki','Owoce morza','Tort','Lody'] },
      { name: 'Letni VIP', description: 'Premium BBQ party z open barem', pricePerAdult: 420, pricePerChild: 294, pricePerToddler: 0, color: '#d97706', icon: 'Diamond', badgeText: 'VIP', isRecommended: true, includedItems: ['Wszystkie przystawki','Zupy','Grillowane mięsa i ryby','Sałatki','Owoce morza live','Tort','Lody','Open bar'] },
    ]
  },
  {
    eventTypeName: 'Urodziny', name: 'Menu Urodzinowe', description: 'Menu na przyjęcie urodzinowe',
    packages: [
      { name: 'Basic', description: 'Podstawowe menu urodzinowe', pricePerAdult: 180, pricePerChild: 126, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['3 przystawki','Zupa','Danie główne','Tort urodzinowy'] },
      { name: 'Premium', description: 'Rozszerzone menu urodzinowe', pricePerAdult: 250, pricePerChild: 175, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Popularny', isPopular: true, includedItems: ['5 przystawek','Zupa','2 dania główne','Dodatki','Tort','Deser'] },
    ]
  },
  {
    eventTypeName: 'Rocznica/Jubileusz', name: 'Menu Jubileuszowe', description: 'Eleganckie menu na rocznicę',
    packages: [
      { name: 'Klasyczne', description: 'Tradycyjne menu na rocznicę', pricePerAdult: 230, pricePerChild: 161, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['4 przystawki','Zupa','Danie główne','2 dodatki','Tort'] },
      { name: 'Eleganckie', description: 'Wyrafinowane menu jubileuszowe', pricePerAdult: 300, pricePerChild: 210, pricePerToddler: 0, color: '#d97706', icon: 'Crown', badgeText: 'Eleganckie', isRecommended: true, includedItems: ['6 przystawek','2 zupy','2 dania główne','3 dodatki','Deska serów','Tort','Desery'] },
    ]
  },
  {
    eventTypeName: 'Komunia', name: 'Menu Komunijne', description: 'Menu na Pierwszą Komunię Świętą',
    packages: [
      { name: 'Tradycyjne', description: 'Klasyczne menu komunijne', pricePerAdult: 200, pricePerChild: 140, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['3 przystawki','Rosół','Danie główne','Dodatki','Tort komunijny'] },
      { name: 'Premium', description: 'Rozszerzone menu komunijne', pricePerAdult: 280, pricePerChild: 196, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Polecane', isPopular: true, includedItems: ['5 przystawek','Zupa','2 dania główne','3 dodatki','Menu dziecięce','Tort komunijny','Candy bar'] },
    ]
  },
  {
    eventTypeName: 'Chrzest/Roczek', name: 'Menu na Chrzciny', description: 'Kameralne menu na chrzest lub roczek',
    packages: [
      { name: 'Kameralne', description: 'Idealne na mniejsze przyjęcie', pricePerAdult: 160, pricePerChild: 112, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['2 przystawki','Zupa','Danie główne','Tort'] },
      { name: 'Rodzinne', description: 'Pełne menu rodzinne', pricePerAdult: 220, pricePerChild: 154, pricePerToddler: 0, color: '#10b981', icon: 'Heart', badgeText: 'Rodzinne', isPopular: true, includedItems: ['4 przystawki','Zupa','Danie główne','2 dodatki','Menu dziecięce','Tort','Słodki stół'] },
    ]
  },
  {
    eventTypeName: 'Stypa', name: 'Menu Wspomnieniowe', description: 'Stosowne menu na stypę',
    packages: [
      { name: 'Tradycyjne', description: 'Tradycyjne menu na stypę', pricePerAdult: 150, pricePerChild: 105, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['2 przystawki','Żurek/Rosół','Danie główne','Ciasto'] },
    ]
  },
  {
    eventTypeName: 'Inne', name: 'Menu Bankietowe', description: 'Uniwersalne menu bankietowe',
    packages: [
      { name: 'Standard', description: 'Podstawowy pakiet bankietowy', pricePerAdult: 200, pricePerChild: 140, pricePerToddler: 0, color: '#6b7280', icon: 'Star', includedItems: ['3 przystawki','Zupa','Danie główne','2 dodatki'] },
      { name: 'Premium', description: 'Rozszerzony pakiet bankietowy', pricePerAdult: 280, pricePerChild: 196, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Popularny', isPopular: true, includedItems: ['5 przystawek','2 zupy','2 dania główne','3 dodatki','Deser'] },
      { name: 'VIP', description: 'Ekskluzywny pakiet all-inclusive', pricePerAdult: 360, pricePerChild: 252, pricePerToddler: 0, color: '#d97706', icon: 'Diamond', badgeText: 'All-inclusive', isRecommended: true, includedItems: ['Wszystkie przystawki','Zupy','3 dania główne','Dodatki','Desery','Napoje','Candy bar'] },
    ]
  },
  {
    eventTypeName: 'Wesele', name: 'Menu Weselne Rustykalne', variant: 'rustic', description: 'Menu w klimacie rustykalnym - idealne do Strzech',
    packages: [
      { name: 'Rustykalny Standard', description: 'Tradycyjne polskie smaki', pricePerAdult: 240, pricePerChild: 168, pricePerToddler: 0, color: '#92400e', icon: 'Leaf', includedItems: ['Deska wędlin i serów','Żurek','Schab/Golonka','Kluski','Ciasto domowe'] },
      { name: 'Rustykalny Premium', description: 'Rozbudowane menu rustykalne', pricePerAdult: 310, pricePerChild: 217, pricePerToddler: 0, color: '#78350f', icon: 'Crown', badgeText: 'Rustic', isPopular: true, includedItems: ['Deski zakąskowe','2 zupy','2 dania główne','Pieczywo własne','Domowe ciasta','Nalewki'] },
    ]
  },
  {
    eventTypeName: 'Urodziny', name: 'Menu Urodzinowe Kids', variant: 'kids', description: 'Specjalne menu na urodziny dziecięce',
    packages: [
      { name: 'Kids Party', description: 'Zabawne menu dla dzieci', pricePerAdult: 150, pricePerChild: 120, pricePerToddler: 0, color: '#7c3aed', icon: 'Sparkles', badgeText: '🎈', isPopular: true, includedItems: ['Mini pizza','Nuggetsy','Frytki','Tort urodzinowy','Słodycze','Napoje'] },
      { name: 'Kids Party Premium', description: 'Rozszerzone party z animacjami', pricePerAdult: 200, pricePerChild: 160, pricePerToddler: 0, color: '#2563eb', icon: 'Crown', badgeText: 'Premium', isRecommended: true, includedItems: ['Mini pizza','Nuggetsy','Naleśniki','Lody','Tort','Candy bar','Animator'] },
    ]
  },
  {
    eventTypeName: 'Komunia', name: 'Menu Komunijne Premium', variant: 'premium', description: 'Ekskluzywne menu na Komunię',
    packages: [
      { name: 'Złote', description: 'Menu premium na wyjątkową Komunię', pricePerAdult: 320, pricePerChild: 224, pricePerToddler: 0, color: '#d97706', icon: 'Diamond', badgeText: 'Złote', isRecommended: true, includedItems: ['6 przystawek','2 zupy','2 dania główne','4 dodatki','Deska serów','Tort komunijny','Candy bar','Lody'] },
    ]
  },
  {
    eventTypeName: 'Rocznica/Jubileusz', name: 'Menu Złote Gody', variant: '50-lecie', description: 'Specjalne menu na 50. rocznicę ślubu',
    packages: [
      { name: 'Złote Gody', description: 'Wyjątkowe menu na wyjątkową okazję', pricePerAdult: 350, pricePerChild: 245, pricePerToddler: 0, color: '#d97706', icon: 'Diamond', badgeText: 'Złote Gody', isRecommended: true, includedItems: ['8 przystawek','2 zupy','2 dania główne','4 dodatki','Deska','Tort rocznicowy','Desery','Napoje premium'] },
    ]
  },
]

// ═══════════════════════════════════════════════════════════════
// MENU OPTIONS (standalone add-ons for packages)
// ═══════════════════════════════════════════════════════════════

const MENU_OPTIONS_DATA = [
  { name: 'Dodatkowa przystawka rybna', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 25, description: 'Łosoś, śledź, krewetki' },
  { name: 'Dodatkowe danie główne', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 45, description: 'Drugie danie do wyboru z karty' },
  { name: 'Stacja sushi live', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 55, description: 'Sushi robione na żywo przez szefa kuchni' },
  { name: 'Deska serów europejskich', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 30, description: 'Selekcja 6 serów z konfiturą' },
  { name: 'Stacja grillowa outdoor', category: 'Jedzenie', priceType: 'FLAT', priceAmount: 3500, description: 'Grill z obsługą na tarasie' },
  { name: 'Kuchnia azjatycka live', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 40, description: 'Wok na żywo - pad thai, stir fry' },
  { name: 'Pasta station', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 35, description: 'Makaron gotowany na zamówienie' },
  { name: 'Stół deserowy rozszerzony', category: 'Desery', priceType: 'PER_PERSON', priceAmount: 30, description: 'Mini desery, pralinki, makaroniki' },
  { name: 'Fontanna czekoladowa', category: 'Desery', priceType: 'FLAT', priceAmount: 800, description: 'Z owocami i pralinami' },
  { name: 'Lody rzemieślnicze station', category: 'Desery', priceType: 'PER_PERSON', priceAmount: 20, description: '8 smaków lodów do wyboru' },
  { name: 'Candy bar premium', category: 'Desery', priceType: 'PER_PERSON', priceAmount: 45, description: 'Bogaty słodki stół' },
  { name: 'Tort piętrowy upgrade', category: 'Desery', priceType: 'FLAT', priceAmount: 500, description: 'Dodatkowe piętro tortu + dekoracja' },
  { name: 'Crêpes station', category: 'Desery', priceType: 'PER_PERSON', priceAmount: 25, description: 'Naleśniki na żywo z dodatkami' },
  { name: 'Open bar standard (4h)', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 90, description: 'Wódka, wino, piwo, napoje' },
  { name: 'Open bar premium (4h)', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 140, description: 'Whisky, gin, rum, koktajle, wino premium' },
  { name: 'Prosecco toast powitalny', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 25, description: 'Kieliszek prosecco na powitanie' },
  { name: 'Bar z nalewkami', category: 'Napoje', priceType: 'FLAT', priceAmount: 1200, description: '10 rodzajów nalewek domowych' },
  { name: 'Drink bar z barmanem', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 65, description: 'Profesjonalny barman + koktajle' },
  { name: 'Lemoniady premium (dzbanki)', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 15, description: '3 rodzaje lemoniad do woli' },
  { name: 'Kawa specialty', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 18, description: 'Barista z espresso barem' },
  { name: 'Fotobudka retro', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 1800, description: 'Z rekwizytami i wydrukami' },
  { name: 'Magic mirror', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 2200, description: 'Interaktywne lustro do zdjęć' },
  { name: 'DJ profesjonalny', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 3000, description: 'DJ z pełnym nagłośnieniem 8h' },
  { name: 'Zespół muzyczny live', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 6000, description: 'Zespół 4-osobowy na 5h' },
  { name: 'Animator dla dzieci', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 800, description: 'Animator na 3h z atrakcjami' },
  { name: 'Pokaz sztucznych ogni', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 2500, description: 'Fajerwerki 5-minutowe' },
  { name: 'Ciężki dym na parkiet', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 600, description: 'Efekt taniec w chmurach' },
  { name: 'Dekoracja kwiatowa basic', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 1500, description: 'Bukiety na stoły + dekoracja główna' },
  { name: 'Dekoracja kwiatowa premium', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 3500, description: 'Pełna oprawa kwiatowa sali' },
  { name: 'Oświetlenie LED dekoracyjne', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 1200, description: 'Kolorowe oświetlenie sali' },
  { name: 'Napis LOVE podświetlany', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 400, description: 'Duży napis LED' },
  { name: 'Brama balonowa', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 600, description: 'Dekoracja balonowa wejścia' },
  { name: 'Menu drukowane personalizowane', category: 'Extras', priceType: 'PER_PERSON', priceAmount: 8, description: 'Eleganckie karty menu z imionami gości' },
  { name: 'Winietki i plan stołów', category: 'Extras', priceType: 'FLAT', priceAmount: 300, description: 'Personalizowane z grafiką' },
  { name: 'Księga gości', category: 'Extras', priceType: 'FLAT', priceAmount: 150, description: 'Elegancka księga w skórzanej oprawie' },
  { name: 'Transport gości busem', category: 'Extras', priceType: 'FLAT', priceAmount: 1500, description: 'Bus 50-osobowy na trasie kościół-sala' },
  { name: 'Parking VIP z obsługą', category: 'Extras', priceType: 'FLAT', priceAmount: 500, description: 'Wydzielony parking z valet' },
  { name: 'Późne wyjście (+2h)', category: 'Extras', priceType: 'FLAT', priceAmount: 2000, description: 'Przedłużenie imprezy o 2h po północy' },
  { name: 'Nocleg dla pary', category: 'Extras', priceType: 'FLAT', priceAmount: 400, description: 'Apartament dla nowożeńców' },
  { name: 'Pokaz barmański flair', category: 'Rozrywka', priceType: 'FLAT', priceAmount: 1500, description: '30-minutowy pokaz żonglowania butelkami' },
  { name: 'Strefa lounge z hookah', category: 'Extras', priceType: 'FLAT', priceAmount: 800, description: 'Strefa relaksu z shishą premium' },
  { name: 'Ścianka do zdjęć', category: 'Dekoracje', priceType: 'FLAT', priceAmount: 700, description: 'Personalizowana ścianka z kwiatami' },
  { name: 'Konfetti i serpentyny', category: 'Extras', priceType: 'FLAT', priceAmount: 200, description: 'Na pierwszy taniec lub tort' },
  { name: 'Zimne ognie na tort', category: 'Extras', priceType: 'FLAT', priceAmount: 100, description: 'Efektowne zimne ognie' },
  { name: 'Weselny koktajl powitalny', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 20, description: 'Signature drink na powitanie gości' },
  { name: 'Stacja z owocami morza', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 85, description: 'Ostrygi, krewetki, krab na lodzie' },
  { name: 'Late night snack', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 30, description: 'Burgery/hot-dogi o północy' },
  { name: 'Brunch poweselny', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 55, description: 'Śniadanie następnego dnia dla gości' },
  { name: 'Cheese & Wine corner', category: 'Jedzenie', priceType: 'PER_PERSON', priceAmount: 50, description: 'Degustacja serów i win' },
  { name: 'Food truck z burgerami', category: 'Jedzenie', priceType: 'FLAT', priceAmount: 4000, description: 'Food truck na 4h z obsługą' },
]

// ═══════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('🚀 E2E SEED - START')
  console.log('═══════════════════════════════════════\n')

  // ─── CLEANUP ───
  console.log('🗑️  Czyszczenie bazy...')
  await prisma.menuPriceHistory.deleteMany()
  await prisma.reservationMenuSnapshot.deleteMany()
  await prisma.menuPackageOption.deleteMany()
  await prisma.packageCategorySettings.deleteMany()
  await prisma.menuOption.deleteMany()
  await prisma.menuPackage.deleteMany()
  await prisma.menuTemplate.deleteMany()
  await prisma.addonGroupDish.deleteMany()
  await prisma.addonGroup.deleteMany()
  await prisma.dish.deleteMany()
  await prisma.dishCategory.deleteMany()
  await prisma.deposit.deleteMany()
  await prisma.reservationHistory.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.client.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.hall.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Baza wyczyszczona\n')

  // ─── USER ───
  console.log('👤 Tworzenie użytkownika...')
  const hashedPassword = bcrypt.hashSync('Admin123!@#', 10)
  const admin = await prisma.user.create({
    data: { email: 'admin@gosciniecrodzinny.pl', password: hashedPassword, firstName: 'System', lastName: 'Administrator', role: 'ADMIN', isActive: true },
  })
  console.log(`✅ Admin: admin@gosciniecrodzinny.pl / Admin123!@#\n`)

  // ─── HALLS ───
  console.log('🏛️  Tworzenie sal...')
  const halls = await Promise.all(HALLS.map(h => prisma.hall.create({ data: h })))
  console.log(`✅ ${halls.length} sal\n`)

  // ─── EVENT TYPES ───
  console.log('🎭 Tworzenie typów wydarzeń...')
  const eventTypes = await Promise.all(EVENT_TYPES.map(et => prisma.eventType.create({ data: et })))
  const etMap = Object.fromEntries(eventTypes.map(et => [et.name, et]))
  console.log(`✅ ${eventTypes.length} typów\n`)

  // ─── DISH CATEGORIES ───
  console.log('📂 Tworzenie kategorii dań...')
  const categories = await Promise.all(DISH_CATEGORIES.map(c => prisma.dishCategory.create({ data: c })))
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c]))
  console.log(`✅ ${categories.length} kategorii\n`)

  // ─── DISHES ───
  console.log('🍽️  Tworzenie dań...')
  let dishCount = 0
  const dishesByCategory: Record<string, any[]> = {}
  for (const [slug, dishes] of Object.entries(DISHES_BY_CATEGORY)) {
    const cat = catMap[slug]
    if (!cat) continue
    dishesByCategory[slug] = []
    for (let i = 0; i < dishes.length; i++) {
      const d = dishes[i]
      const dish = await prisma.dish.create({
        data: { categoryId: cat.id, name: d.name, description: d.description || null, allergens: d.allergens || [], displayOrder: i + 1 },
      })
      dishesByCategory[slug].push(dish)
      dishCount++
    }
  }
  console.log(`✅ ${dishCount} dań\n`)

  // ─── ADDON GROUPS ───
  console.log('🎁 Tworzenie grup addonów...')
  const addonGroups = await Promise.all(ADDON_GROUPS.map(ag => prisma.addonGroup.create({ data: ag })))

  // Link some dishes to addon groups
  let addonDishCount = 0
  const allDishes = Object.values(dishesByCategory).flat()
  for (const group of addonGroups) {
    const count = randInt(3, 6)
    const shuffled = [...allDishes].sort(() => Math.random() - 0.5).slice(0, count)
    for (let i = 0; i < shuffled.length; i++) {
      await prisma.addonGroupDish.create({
        data: { groupId: group.id, dishId: shuffled[i].id, displayOrder: i + 1, customPrice: Math.random() > 0.5 ? randInt(10, 50) : null },
      })
      addonDishCount++
    }
  }
  console.log(`✅ ${addonGroups.length} grup addonów, ${addonDishCount} powiązań\n`)

  // ─── MENU TEMPLATES & PACKAGES ───
  console.log('📋 Tworzenie menu templates i pakietów...')
  let templateCount = 0
  let packageCount = 0
  const allPackages: any[] = []

  for (const tmplCfg of MENU_TEMPLATES) {
    const eventType = etMap[tmplCfg.eventTypeName]
    if (!eventType) continue

    const template = await prisma.menuTemplate.create({
      data: {
        eventTypeId: eventType.id,
        name: tmplCfg.name,
        description: tmplCfg.description,
        variant: tmplCfg.variant || null,
        isActive: true,
        displayOrder: templateCount + 1,
      },
    })
    templateCount++

    for (let i = 0; i < tmplCfg.packages.length; i++) {
      const pkgCfg = tmplCfg.packages[i]
      const pkg = await prisma.menuPackage.create({
        data: {
          menuTemplateId: template.id,
          name: pkgCfg.name,
          description: pkgCfg.description,
          pricePerAdult: pkgCfg.pricePerAdult,
          pricePerChild: pkgCfg.pricePerChild,
          pricePerToddler: pkgCfg.pricePerToddler,
          color: pkgCfg.color,
          icon: pkgCfg.icon,
          badgeText: pkgCfg.badgeText || null,
          isPopular: pkgCfg.isPopular || false,
          isRecommended: pkgCfg.isRecommended || false,
          includedItems: pkgCfg.includedItems,
          displayOrder: i + 1,
        },
      })
      allPackages.push({ ...pkg, templateName: tmplCfg.name })
      packageCount++
    }
  }
  console.log(`✅ ${templateCount} templates, ${packageCount} pakietów\n`)

  // ─── MENU OPTIONS ───
  console.log('⚙️  Tworzenie opcji menu...')
  const menuOptions = await Promise.all(MENU_OPTIONS_DATA.map((o, i) =>
    prisma.menuOption.create({
      data: { name: o.name, description: o.description, category: o.category, priceType: o.priceType, priceAmount: o.priceAmount, displayOrder: i + 1 },
    })
  ))
  console.log(`✅ ${menuOptions.length} opcji\n`)

  // ─── MENU PACKAGE OPTIONS (link options to packages) ───
  console.log('🔗 Łączenie opcji z pakietami...')
  let mpoCount = 0
  for (const pkg of allPackages) {
    const optCount = randInt(4, 10)
    const shuffledOpts = [...menuOptions].sort(() => Math.random() - 0.5).slice(0, optCount)
    for (let i = 0; i < shuffledOpts.length; i++) {
      const opt = shuffledOpts[i]
      await prisma.menuPackageOption.create({
        data: {
          packageId: pkg.id,
          optionId: opt.id,
          isDefault: i < 2,
          isRequired: i === 0,
          displayOrder: i + 1,
          customPrice: Math.random() > 0.7 ? Number(opt.priceAmount) * 0.9 : null,
        },
      })
      mpoCount++
    }
  }
  console.log(`✅ ${mpoCount} powiązań pakiet↔opcja\n`)

  // ─── PACKAGE CATEGORY SETTINGS ───
  console.log('📊 Tworzenie ustawień kategorii w pakietach...')
  let pcsCount = 0
  const enabledCats = ['przystawki', 'zupy', 'dania-glowne', 'dodatki', 'salatki', 'desery']
  for (const pkg of allPackages) {
    for (let i = 0; i < enabledCats.length; i++) {
      const cat = catMap[enabledCats[i]]
      if (!cat) continue
      const tier = pkg.pricePerAdult >= 300 ? 3 : pkg.pricePerAdult >= 220 ? 2 : 1
      await prisma.packageCategorySettings.create({
        data: {
          packageId: pkg.id,
          categoryId: cat.id,
          minSelect: enabledCats[i] === 'zupy' ? 1 : tier,
          maxSelect: enabledCats[i] === 'zupy' ? 2 : tier + 2,
          isRequired: ['dania-glowne', 'zupy'].includes(enabledCats[i]),
          isEnabled: true,
          displayOrder: i + 1,
        },
      })
      pcsCount++
    }
  }
  console.log(`✅ ${pcsCount} ustawień kategorii\n`)

  // ─── CLIENTS ───
  console.log('👥 Tworzenie klientów (100)...')
  const clients = []
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.5
    const fn = isMale ? rand(FIRST_M) : rand(FIRST_F)
    const ln = rand(LAST)
    const client = await prisma.client.create({
      data: { firstName: fn, lastName: ln, email: genEmail(fn, ln, i + 1), phone: genPhone(), notes: rand(NOTES_POOL) },
    })
    clients.push(client)
  }
  console.log(`✅ ${clients.length} klientów\n`)

  // ─── RESERVATIONS (80) ───
  console.log('📅 Tworzenie rezerwacji (80)...')
  const now = new Date()
  const reservations = []

  const resConfigs: { count: number; status: ReservationStatus; dateRange: [Date, Date]; withMenu?: boolean; special?: string }[] = [
    { count: 15, status: 'COMPLETED', dateRange: [new Date(2025, 11, 1), new Date(2026, 1, 10)] },
    { count: 8, status: 'CANCELLED', dateRange: [new Date(2026, 0, 1), new Date(2026, 7, 1)] },
    { count: 25, status: 'CONFIRMED', dateRange: [new Date(2026, 2, 1), new Date(2026, 7, 31)], withMenu: true },
    { count: 15, status: 'PENDING', dateRange: [new Date(2026, 2, 1), new Date(2026, 9, 1)] },
    { count: 7, status: 'CONFIRMED', dateRange: [new Date(2026, 3, 1), new Date(2026, 8, 1)], special: 'birthday' },
    { count: 5, status: 'CONFIRMED', dateRange: [new Date(2026, 4, 1), new Date(2026, 9, 1)], special: 'anniversary' },
    { count: 5, status: 'PENDING', dateRange: [new Date(2026, 5, 1), new Date(2026, 11, 1)] },
  ]

  for (const cfg of resConfigs) {
    for (let i = 0; i < cfg.count; i++) {
      const client = rand(clients)
      const hall = rand(halls)
      const eventType = cfg.special === 'birthday' ? etMap['Urodziny'] : cfg.special === 'anniversary' ? etMap['Rocznica/Jubileusz'] : rand(eventTypes)
      const eventDate = randDate(cfg.dateRange[0], cfg.dateRange[1])

      const adults = randInt(Math.floor(hall.capacity * 0.3), hall.capacity)
      const children = randInt(0, Math.floor(adults * 0.2))
      const toddlers = randInt(0, Math.floor(adults * 0.1))
      const guests = adults + children + toddlers

      const startHour = randInt(14, 18)
      const startDT = new Date(eventDate); startDT.setHours(startHour, 0, 0, 0)
      const endHour = randInt(22, 23)
      const endDT = new Date(eventDate); endDT.setHours(endHour, 0, 0, 0)

      const ppa = Number(hall.pricePerPerson)
      const ppc = Number(hall.pricePerChild || 0)
      const ppt = Number(hall.pricePerToddler || 0)
      const total = adults * ppa + children * ppc + toddlers * ppt

      const resData: any = {
        clientId: client.id,
        createdById: admin.id,
        hallId: hall.id,
        eventTypeId: eventType.id,
        startDateTime: startDT,
        endDateTime: endDT,
        date: fmtDate(eventDate),
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(endHour).padStart(2, '0')}:00`,
        adults, children, toddlers, guests,
        pricePerAdult: ppa, pricePerChild: ppc, pricePerToddler: ppt, totalPrice: total,
        status: cfg.status,
        notes: Math.random() > 0.6 ? rand(['Proszę o dekoracje','Potrzebny rzutnik','Dużo dzieci - animator','Dieta bezglutenowa x3','VIP - wymagający klient']) : null,
      }

      if (cfg.special === 'birthday') {
        resData.birthdayAge = randInt(18, 80)
        resData.customEventType = `Urodziny ${resData.birthdayAge}-ste`
      }
      if (cfg.special === 'anniversary') {
        resData.anniversaryYear = rand([10, 25, 30, 40, 50])
        resData.anniversaryOccasion = `${resData.anniversaryYear}. rocznica ślubu`
      }

      const res = await prisma.reservation.create({ data: resData })
      reservations.push(res)

      // Deposit for CONFIRMED
      if (cfg.status === 'CONFIRMED' && Math.random() > 0.2) {
        const amt = Math.floor(total * 0.3)
        const dueDate = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        await prisma.deposit.create({
          data: {
            reservationId: res.id, amount: amt, remainingAmount: 0,
            dueDate, paid: true, status: 'PAID',
            paidAt: new Date(now.getTime() - randInt(5, 60) * 86400000),
            paymentMethod: rand(['CASH', 'TRANSFER', 'BLIK']),
          },
        })
      }

      // Menu snapshot for some CONFIRMED
      if (cfg.withMenu && i < 20 && allPackages.length > 0) {
        const pkg = rand(allPackages)
        const pkgPrice = Number(pkg.pricePerAdult) * adults + Number(pkg.pricePerChild) * children
        const optPrice = randInt(500, 3000)
        await prisma.reservationMenuSnapshot.create({
          data: {
            reservationId: res.id,
            menuData: { packageName: pkg.name, templateName: pkg.templateName, selectedDishes: [], selectedOptions: [] },
            menuTemplateId: null,
            packageId: null,
            packagePrice: pkgPrice,
            optionsPrice: optPrice,
            totalMenuPrice: pkgPrice + optPrice,
            adultsCount: adults,
            childrenCount: children,
            toddlersCount: toddlers,
          },
        })
      }
    }
  }
  console.log(`✅ ${reservations.length} rezerwacji\n`)

  // ─── QUEUE (60) ───
  console.log('⏳ Tworzenie kolejki (60)...')
  const queueStart = new Date(2026, 2, 1)
  let queueCount = 0
  for (let w = 0; w < 12; w++) {
    const targetDate = new Date(queueStart)
    targetDate.setDate(targetDate.getDate() + w * 7)
    targetDate.setHours(0, 0, 0, 0)

    for (let pos = 1; pos <= 5; pos++) {
      const client = rand(clients)
      const et = rand(eventTypes)
      const adults = randInt(30, 120)
      const children = randInt(0, 25)
      const toddlers = randInt(0, 10)

      await prisma.reservation.create({
        data: {
          clientId: client.id, createdById: admin.id, eventTypeId: et.id,
          reservationQueueDate: targetDate, reservationQueuePosition: pos,
          queueOrderManual: pos <= 2 && Math.random() > 0.5,
          adults, children, toddlers, guests: adults + children + toddlers,
          pricePerAdult: 0, pricePerChild: 0, pricePerToddler: 0, totalPrice: 0,
          status: 'RESERVED',
          notes: `Kolejka ${fmtDate(targetDate)} poz. ${pos}`,
        },
      })
      queueCount++
    }
  }
  console.log(`✅ ${queueCount} wpisów w kolejce\n`)

  // ─── RESERVATION HISTORY ───
  console.log('📜 Tworzenie historii rezerwacji...')
  const historyReservations = reservations.slice(0, 30)
  let histCount = 0
  for (const res of historyReservations) {
    const changes = randInt(1, 3)
    for (let c = 0; c < changes; c++) {
      const changeType = rand(['STATUS_CHANGE', 'FIELD_UPDATE', 'HALL_CHANGE', 'DATE_CHANGE'])
      await prisma.reservationHistory.create({
        data: {
          reservationId: res.id, changedByUserId: admin.id,
          changeType,
          fieldName: changeType === 'STATUS_CHANGE' ? 'status' : changeType === 'HALL_CHANGE' ? 'hallId' : changeType === 'DATE_CHANGE' ? 'date' : rand(['adults', 'notes', 'guests']),
          oldValue: changeType === 'STATUS_CHANGE' ? 'PENDING' : 'stara wartość',
          newValue: changeType === 'STATUS_CHANGE' ? res.status : 'nowa wartość',
          reason: Math.random() > 0.5 ? rand(['Prośba klienta', 'Zmiana planów', 'Korekta danych', 'Dostępność sali']) : null,
        },
      })
      histCount++
    }
  }
  console.log(`✅ ${histCount} wpisów historii\n`)

  // ─── ACTIVITY LOGS ───
  console.log('📝 Tworzenie logów aktywności...')
  const logActions = ['LOGIN', 'RESERVATION_CREATE', 'RESERVATION_UPDATE', 'CLIENT_CREATE', 'MENU_UPDATE', 'DEPOSIT_CREATE', 'QUEUE_REORDER', 'EXPORT_PDF']
  let logCount = 0
  for (let i = 0; i < 25; i++) {
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: rand(logActions),
        entityType: rand(['Reservation', 'Client', 'MenuTemplate', 'Deposit', null]),
        entityId: reservations.length > 0 ? rand(reservations).id : null,
        details: { timestamp: new Date().toISOString(), source: 'seed-e2e' },
        ipAddress: '192.168.1.1',
        userAgent: 'Seed/E2E',
        createdAt: randDate(new Date(2026, 0, 1), now),
      },
    })
    logCount++
  }
  console.log(`✅ ${logCount} logów\n`)

  // ─── SUMMARY ───
  console.log('═══════════════════════════════════════')
  console.log('📊 PODSUMOWANIE E2E SEED')
  console.log('═══════════════════════════════════════')
  console.log(`👤 User:                   1`)
  console.log(`🏛️  Halls:                  ${halls.length}`)
  console.log(`🎭 Event Types:            ${eventTypes.length}`)
  console.log(`📂 Dish Categories:        ${categories.length}`)
  console.log(`🍽️  Dishes:                 ${dishCount}`)
  console.log(`🎁 Addon Groups:           ${addonGroups.length}`)
  console.log(`🔗 Addon↔Dish:             ${addonDishCount}`)
  console.log(`📋 Menu Templates:         ${templateCount}`)
  console.log(`📦 Menu Packages:          ${packageCount}`)
  console.log(`⚙️  Menu Options:            ${menuOptions.length}`)
  console.log(`🔗 Package↔Option:         ${mpoCount}`)
  console.log(`📊 Category Settings:      ${pcsCount}`)
  console.log(`👥 Clients:                ${clients.length}`)
  console.log(`📅 Reservations:           ${reservations.length}`)
  console.log(`⏳ Queue:                  ${queueCount}`)
  console.log(`📜 History:                ${histCount}`)
  console.log(`📝 Activity Logs:          ${logCount}`)
  console.log('═══════════════════════════════════════')
  console.log(`📈 TOTAL:                  ~${1 + halls.length + eventTypes.length + categories.length + dishCount + addonGroups.length + addonDishCount + templateCount + packageCount + menuOptions.length + mpoCount + pcsCount + clients.length + reservations.length + queueCount + histCount + logCount}+ records`)
  console.log('═══════════════════════════════════════')
  console.log('✅ E2E Seed zakończony pomyślnie!')
  console.log('\n🔑 Login: admin@gosciniecrodzinny.pl / Admin123!@#')
}

main()
  .catch((e) => { console.error('❌ Błąd:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
