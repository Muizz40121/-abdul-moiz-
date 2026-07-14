const bcrypt = require('bcryptjs');
const pool = require('./pool');

function seed() {
  const existing = pool.query('SELECT COUNT(*) AS count FROM products');
  if (existing.rows[0].count > 100) return;

  const hash = bcrypt.hashSync('password123', 10);
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];
  const sellerNames = [
    'Ali Raza', 'Sana Malik', 'Usman Ghani', 'Ayyan Asif', 'Fatima Khan',
    'Ahmed Nawaz', 'Zainab Bibi', 'Hassan Ali', 'Ayesha Siddiqui', 'Bilal Ahmed',
    'Omar Farooq', 'Maryam Bibi', 'Kamran Shah', 'Nadia Parveen', 'Tariq Mahmood',
    'Rabia Sultan', 'Faisal Naveed', 'Saima Kausar', 'Imran Akhtar', 'Samina Yasmin',
    'Danish Rehman', 'Hira Malik', 'Shahid Iqbal', 'Amna Tariq', 'Waqas Ahmad',
    'Saba Nazir', 'Rizwan Ahmed', 'Maham Gillani', 'Junaid Akram', 'Neha Butt'
  ];

  const users = sellerNames.map((name, i) => ({
    name, email: `seller${i + 1}@test.com`, password: hash,
    phone: `03${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
    location: cities[i % cities.length]
  }));
  users.push({ name: 'Ayyan Asif', email: 'ayyan.asif40121@gmail.com', password: hash, phone: '03344028068', location: 'Lahore', is_admin: 1 });
  const userIds = [];
  for (const u of users) {
    pool.query('INSERT OR IGNORE INTO users (name, email, password, phone, location, is_admin) VALUES (?, ?, ?, ?, ?, ?)', [u.name, u.email, u.password, u.phone, u.location, u.is_admin || 0]);
    pool.query('UPDATE users SET is_admin = ? WHERE email = ? AND is_admin < ?', [u.is_admin || 0, u.email, u.is_admin || 0]);
    const r = pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (r.rows.length) userIds.push(r.rows[0].id);
  }

  const unsplash = {
    vehicles: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0abb?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1471479917193-f00955256257?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop',
    ],
    property: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1416331108676-a12cce90faa2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
    ],
    electronics: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=600&h=400&fit=crop',
    ],
    furniture: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=400&fit=crop',
    ],
    fashion: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1434389677669-e08b4cda3a07?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop',
    ],
    books: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop',
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-bd45ba71b5b1?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop',
    ],
    pets: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1425082661507-d6e2f60e1d53?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=400&fit=crop',
    ],
    services: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    ],
    jobs: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    ],
    food: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop',
    ],
    music: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    ],
  };

  const catImages = {
    1: unsplash.vehicles, 2: unsplash.property, 3: unsplash.electronics,
    4: unsplash.furniture, 5: unsplash.fashion, 6: unsplash.books,
    7: unsplash.sports, 8: unsplash.pets, 9: unsplash.services,
    10: unsplash.jobs, 11: unsplash.food, 12: unsplash.music,
  };

  const productTemplates = {
    1: [
      { t: (m, y, c) => `${c} ${m} ${y} - Excellent Condition`, d: (m, y, c, l) => `Well maintained ${c} ${m} ${y} model. Single owner, driven carefully. All documents clear. Located in ${l}.`, p: [400000, 8500000] },
      { t: (m, y, c) => `${c} ${m} ${y} - Low Mileage`, d: (m, y, c, l) => `Selling my ${c} ${m} ${y}. Only ${Math.floor(Math.random()*40+10)}k km driven. AC, power windows, ABS. Price negotiable. ${l}.`, p: [500000, 7000000] },
      { t: (m, y, c) => `${c} ${m} ${y} - Automatic`, d: (m, y, c, l) => `${c} ${m} ${y} automatic transmission. Touchless start, backup camera, alloy wheels. ${l}.`, p: [800000, 9000000] },
      { t: (m, y, c) => `Selling ${c} ${m} ${y} - Urgent`, d: (m, y, c, l) => `Urgent sale! ${c} ${m} ${y}. Perfect condition. Reasonable price. Come see in ${l}.`, p: [350000, 6000000] },
    ],
    2: [
      { t: (b, l) => `${b} House for Sale in ${l}`, d: (b, l) => `${b} beautiful house for sale in ${l}. ${Math.floor(Math.random()*4+2)} bedrooms, ${Math.floor(Math.random()*3+2)} bathrooms, car porch, lawn.`, p: [8000000, 45000000] },
      { t: (b, l) => `${b} Apartment for Rent in ${l}`, d: (b, l) => `${b} furnished apartment for rent in ${l}. ${Math.floor(Math.random()*3+2)} bed, ${Math.floor(Math.random()*2+1)} bath. Monthly rent.`, p: [30000, 150000] },
      { t: (b, l) => `${b} Plot for Sale - ${l}`, d: (b, l) => `${b} residential plot in prime location of ${l}. ${Math.floor(Math.random()*10+5)} marla. All utilities available.`, p: [3000000, 20000000] },
      { t: (b, l) => `Commercial Shop in ${l} - ${b}`, d: (b, l) => `${b} commercial shop in main market of ${l}. Ground floor, high footfall area.`, p: [5000000, 30000000] },
    ],
    3: [
      { t: (m, b) => `${b} ${m} - Brand New`, d: (m, b) => `Brand new ${b} ${m}. Sealed box, official warranty. PTA approved if applicable.`, p: [5000, 350000] },
      { t: (m, b) => `${b} ${m} - Like New`, d: (m, b) => `Used ${b} ${m} in like-new condition. ${Math.floor(Math.random()*12+1)} months old. All accessories included.`, p: [3000, 250000] },
      { t: (m, b) => `${b} ${m} - Good Condition`, d: (m, b) => `${b} ${m} in good working condition. Minor scratches. Battery health ${Math.floor(Math.random()*30+70)}%.`, p: [2000, 200000] },
    ],
    4: [
      { t: (m) => `${m} - Premium Quality`, d: (m) => `High quality ${m}. Beautiful design, durable material. Perfect for modern homes.`, p: [5000, 150000] },
      { t: (m) => `${m} - For Sale`, d: (m) => `Selling my ${m}. Excellent condition, barely used. Can deliver.`, p: [3000, 80000] },
      { t: (m) => `${m} - Discounted`, d: (m) => `${m} at discounted price. Moving sale. Must go this week.`, p: [2000, 60000] },
    ],
    5: [
      { t: (m, b) => `${b} ${m} - Original`, d: (m, b) => `Original ${b} ${m}. Premium quality fabric. Available in multiple sizes.`, p: [500, 15000] },
      { t: (m, b) => `${b} ${m} Collection`, d: (m, b) => `Latest ${b} ${m} collection. Trendy design. Size: ${['S','M','L','XL','XXL'][Math.floor(Math.random()*5)]}.`, p: [800, 25000] },
      { t: (m, b) => `${b} ${m} - Clearance Sale`, d: (m, b) => `${b} ${m} on clearance. Original price much higher. Limited stock.`, p: [300, 8000] },
    ],
    6: [
      { t: (m) => `${m} - Like New`, d: (m) => `Book: ${m}. Like new condition. Read once. Great for students.`, p: [200, 3000] },
      { t: (m) => `${m} - Must Read`, d: (m) => `"${m}" - bestseller book. Hardcover/Paperback available.`, p: [300, 2000] },
    ],
    7: [
      { t: (m) => `${m} - Professional Grade`, d: (m) => `Professional ${m}. Top quality. Used by athletes.`, p: [5000, 150000] },
      { t: (m) => `${m} - For Sale`, d: (m) => `Selling ${m}. Good condition. Perfect for beginners.`, p: [2000, 80000] },
      { t: (m) => `${m} - barely Used`, d: (m) => `${m} - barely used. Selling due to relocation.`, p: [3000, 50000] },
    ],
    8: [
      { t: (m) => `${m} - Vaccinated`, d: (m) => `Beautiful ${m} available. Fully vaccinated. Health certificate provided.`, p: [5000, 80000] },
      { t: (m) => `${m} - Cute Puppies`, d: (m) => `Adorable ${m} puppies. ${Math.floor(Math.random()*8+4)} weeks old. Ready to go home.`, p: [10000, 60000] },
    ],
    9: [
      { t: (m) => `${m} Services Available`, d: (m) => `Professional ${m} services. Experienced team. Affordable rates. Call for quote.`, p: [1000, 50000] },
      { t: (m) => `${m} - Expert Available`, d: (m) => `Expert ${m} services. Quick turnaround. 100% satisfaction guaranteed.`, p: [2000, 100000] },
    ],
    10: [
      { t: (m) => `${m} - Immediate Joining`, d: (m) => `${m} position available. Immediate joining. Salary: PKR ${Math.floor(Math.random()*80+30)}K monthly.`, p: [0, 0] },
      { t: (m) => `${m} - Experienced Required`, d: (m) => `${m} needed. ${Math.floor(Math.random()*5+2)} years experience required. ${['Karachi','Lahore','Islamabad'][Math.floor(Math.random()*3)]}.`, p: [0, 0] },
    ],
    11: [
      { t: (m) => `Fresh ${m} - Farm Direct`, d: (m) => `Fresh ${m} directly from farm. Organic, no chemicals. Bulk orders welcome.`, p: [100, 5000] },
      { t: (m) => `${m} - Premium Quality`, d: (m) => `Premium quality ${m}. Fresh and hygienic. Delivered to your doorstep.`, p: [200, 3000] },
    ],
    12: [
      { t: (m) => `${m} - Professional`, d: (m) => `Professional ${m}. Excellent condition. Perfect for beginners and pros.`, p: [3000, 200000] },
      { t: (m) => `${m} - For Sale`, d: (m) => `Selling my ${m}. Works perfectly. Reasonable price.`, p: [1000, 100000] },
    ],
  };

  const catItems = {
    1: [
      { models: ['Toyota Corolla', 'Honda Civic', 'Suzuki Alto', 'Toyota Fortuner', 'Honda City', 'Suzuki Mehran', 'KIA Sportage', 'Hyundai Tucson', 'Toyota Prado', 'Honda BR-V', 'Suzuki Swift', 'KIA Stonic', 'Toyota Hilux', 'Ford Ranger', 'Hyundai Elantra'], brands: ['Toyota', 'Honda', 'Suzuki', 'KIA', 'Hyundai', 'Ford'], years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
      { models: ['CBR 150', 'Yamaha YBR 125', 'Honda CD 70', 'Honda CG 125', 'Suzuki GS 150', 'Yamaha R15', 'Kawasaki Ninja', 'Honda PRS 150'], brands: ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki'], years: [2019, 2020, 2021, 2022, 2023, 2024] },
    ],
    2: [
      { brands: ['3 Bedroom', '2 Bedroom', '4 Bedroom', 'Studio', '1 Bedroom', '5 Bedroom', 'Luxury', 'Modern', 'Brand New', 'Furnished', 'Ground Floor', 'Top Floor', 'Corner'] },
    ],
    3: [
      { models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 13', 'Samsung Galaxy S24', 'Samsung Galaxy S23', 'OnePlus 12', 'Xiaomi 14', 'Google Pixel 8', 'OPPO Find X7', 'Vivo X100', 'Realme GT 5', 'Nothing Phone 2', 'Huawei P60'], brands: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Google', 'OPPO', 'Vivo', 'Realme', 'Nothing', 'Huawei'] },
      { models: ['MacBook Pro 14"', 'MacBook Air M3', 'Dell XPS 15', 'HP Spectre', 'Lenovo ThinkPad', 'ASUS ROG', 'Acer Predator', 'MSI Gaming', 'MacBook Pro 16"', 'Dell Inspiron', 'HP Pavilion', 'Lenovo IdeaPad'], brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI'] },
      { models: ['Sony WH-1000XM5', 'AirPods Pro 2', 'Samsung Galaxy Buds', 'JBL Tune 770NC', 'Bose QuietComfort', 'Sennheiser Momentum', 'Jabra Elite 85t', 'OnePlus Buds Pro'], brands: ['Sony', 'Apple', 'Samsung', 'JBL', 'Bose', 'Sennheiser', 'Jabra', 'OnePlus'] },
      { models: ['iPad Pro 12.9"', 'iPad Air', 'Samsung Galaxy Tab S9', 'Lenovo Tab P12', 'iPad Mini', 'Amazon Fire HD'], brands: ['Apple', 'Samsung', 'Lenovo', 'Amazon'] },
      { models: ['65" OLED 4K TV', '55" QLED TV', '75" LED TV', '50" Smart TV', '43" Android TV', '4K Projector', 'Soundbar System'], brands: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense', 'Xiaomi'] },
      { models: ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PS5 Controller', 'Gaming Keyboard', 'Gaming Mouse', 'Gaming Headset', 'RTX 4070 GPU', 'RTX 4090 GPU'], brands: ['Sony', 'Microsoft', 'Nintendo', 'Logitech', 'Razer', 'NVIDIA'] },
    ],
    4: [
      { models: ['Leather Sofa Set', 'Fabric Sofa', 'L-Shape Sofa', 'Recliner Sofa', 'Dining Table Set', 'King Size Bed', 'Queen Size Bed', 'Wooden Wardrobe', 'Office Desk', 'Bookshelf', 'TV Cabinet', 'Coffee Table', 'Center Table', 'Dressing Table', 'Shoe Rack'], brands: ['IKEA', 'Interwood', 'Master', 'WoodWorks', 'HomeTown', 'Urban Ladder'] },
    ],
    5: [
      { models: ['Denim Jacket', 'Cotton Kameez Shalwar', 'Leather Jacket', 'Silk Saree', 'Formal Suit', 'Winter Coat', 'Sports Shoes', 'Running Sneakers', 'Leather Belt', 'Sunglasses', 'Watch', 'Gold Necklace', 'Diamond Ring', 'Handbag'], brands: ['Nike', 'Adidas', 'Gucci', 'Zara', 'H&M', 'Local Brand', 'Gul Ahmed', 'Khaadi', 'Sapphire'] },
    ],
    6: [
      { models: ['O-Level Mathematics Guide', 'CSS Preparation Book', 'Quran Translation', 'English Grammar', 'Urdu Novel', 'Science Encyclopedia', 'Islamic History', 'Cooking Recipes', 'Self Help Guide', 'Business Strategy'], brands: ['Oxford', 'Cambridge', 'Ilm-o-Irfan', 'Ferozsons'] },
    ],
    7: [
      { models: ['Cricket Bat', 'Football', 'Basketball', 'Tennis Racket', 'Badminton Set', 'Yoga Mat', 'Dumbbells Set', 'Treadmill', 'Exercise Bike', 'Camping Tent', 'Hiking Backpack', 'Swimming Goggles', 'Boxing Gloves', 'Golf Clubs'], brands: ['SS', 'Gray Nicolls', 'Nike', 'Adidas', 'Yonex', 'Wilson', 'Decathlon'] },
    ],
    8: [
      { models: ['Golden Retriever Puppy', 'German Shepherd Puppy', 'Persian Cat', 'Ragdoll Cat', 'Labrador Puppy', 'Bulldog Puppy', 'Siamese Cat', 'Rabbit', 'Parrot', 'Goldfish'], brands: ['Purebred', 'Mixed Breed', 'Pedigree'] },
    ],
    9: [
      { models: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'AC Repair', 'Appliance Repair', 'Interior Design', 'Event Planning', 'Catering', 'Photography', 'Videography', 'Web Development', 'Graphic Design', 'Driving Lessons'], brands: ['Professional', 'Expert', 'Certified', 'Experienced'] },
    ],
    10: [
      { models: ['Software Engineer', 'Accountant', 'Marketing Manager', 'Teacher', 'Doctor', 'Nurse', 'Chef', 'Driver', 'Security Guard', 'Sales Executive', 'HR Manager', 'Graphic Designer', 'Content Writer', 'Data Analyst'], brands: ['Immediate', 'Urgent', 'Full Time', 'Part Time'] },
    ],
    11: [
      { models: ['Organic Mangoes', 'Fresh Vegetables', 'Desi Ghee', 'Honey', 'Rice (Basmati)', 'Wheat Flour', 'Chicken (Organic)', 'Milk (Fresh)', 'Dates', 'Almonds'], brands: ['Farm Fresh', 'Organic', 'Premium', 'Local'] },
    ],
    12: [
      { models: ['Acoustic Guitar', 'Electric Guitar', 'Piano/Keyboard', 'Drum Set', 'Violin', 'Flute', 'Harmonium', 'DJ Mixer', 'Microphone', 'Amplifier'], brands: ['Yamaha', 'Casio', 'Fender', 'Gibson', 'Roland'] },
    ],
  };

  const adTemplates = {
    1: (items) => {
      const subCat = items[Math.floor(Math.random() * items.length)];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const year = subCat.years[Math.floor(Math.random() * subCat.years.length)];
      const tmpl = productTemplates[1][Math.floor(Math.random() * productTemplates[1].length)];
      return { title: tmpl.t(item.split(' ')[0], year, brand), desc: tmpl.d(item.split(' ')[0], year, brand, '{city}') };
    },
    2: (items) => {
      const subCat = items[0];
      const tmpl = productTemplates[2][Math.floor(Math.random() * productTemplates[2].length)];
      return { title: tmpl.t(subCat.brands, '{city}'), desc: tmpl.d(subCat.brands, '{city}') };
    },
    3: (items) => {
      const subCat = items[Math.floor(Math.random() * items.length)];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[3][Math.floor(Math.random() * productTemplates[3].length)];
      return { title: tmpl.t(item, brand), desc: tmpl.d(item, brand) };
    },
    4: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[4][Math.floor(Math.random() * productTemplates[4].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
    5: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[5][Math.floor(Math.random() * productTemplates[5].length)];
      return { title: tmpl.t(item, brand), desc: tmpl.d(item, brand) };
    },
    6: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const tmpl = productTemplates[6][Math.floor(Math.random() * productTemplates[6].length)];
      return { title: tmpl.t(item), desc: tmpl.d(item) };
    },
    7: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[7][Math.floor(Math.random() * productTemplates[7].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
    8: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const tmpl = productTemplates[8][Math.floor(Math.random() * productTemplates[8].length)];
      return { title: tmpl.t(item), desc: tmpl.d(item) };
    },
    9: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[9][Math.floor(Math.random() * productTemplates[9].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
    10: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[10][Math.floor(Math.random() * productTemplates[10].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
    11: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[11][Math.floor(Math.random() * productTemplates[11].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
    12: (items) => {
      const subCat = items[0];
      const item = subCat.models[Math.floor(Math.random() * subCat.models.length)];
      const brand = subCat.brands[Math.floor(Math.random() * subCat.brands.length)];
      const tmpl = productTemplates[12][Math.floor(Math.random() * productTemplates[12].length)];
      return { title: tmpl.t(`${brand} ${item}`), desc: tmpl.d(`${brand} ${item}`) };
    },
  };

  const catDistribution = [
    { id: 1, count: 30 }, { id: 2, count: 25 }, { id: 3, count: 50 },
    { id: 4, count: 20 }, { id: 5, count: 25 }, { id: 6, count: 10 },
    { id: 7, count: 12 }, { id: 8, count: 8 }, { id: 9, count: 8 },
    { id: 10, count: 5 }, { id: 11, count: 4 }, { id: 12, count: 3 },
  ];

  const conditions = ['used'];
  const allAds = [];

  for (const dist of catDistribution) {
    const items = catItems[dist.id];
    const gen = adTemplates[dist.id];
    for (let i = 0; i < dist.count; i++) {
      const { title, desc } = gen(items);
      const city = cities[Math.floor(Math.random() * cities.length)];
      const priceRange = productTemplates[dist.id][0].p;
      const price = dist.id === 10 ? 0 : Math.floor(Math.random() * (priceRange[1] - priceRange[0]) + priceRange[0]);
      allAds.push({
        title: title.replace('{city}', city),
        description: desc.replace('{city}', city),
        price,
        category_id: dist.id,
        seller_id: userIds[Math.floor(Math.random() * userIds.length)],
        location: city,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        views: Math.floor(Math.random() * 1000) + 5,
      });
    }
  }

  for (const ad of allAds) {
    const r = pool.query('INSERT INTO products (title, description, price, condition, category_id, seller_id, location, status, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ad.title, ad.description, ad.price, ad.condition, ad.category_id, ad.seller_id, ad.location, 'active', ad.views]);
    const productId = Number(r.lastInsertRowid);
    const images = catImages[ad.category_id];
    const primaryImg = images[Math.floor(Math.random() * images.length)];
    pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)', [productId, primaryImg]);
  }

  if (userIds.length >= 2) {
    const conv = pool.query('INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES (?, ?, ?)', [1, userIds[1], userIds[0]]);
    pool.query('INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)', [conv.lastInsertRowid, userIds[1], 'Assalam-o-Alaikum! Is this still available?']);
    pool.query('INSERT INTO messages (conversation_id, sender_id, message, is_read) VALUES (?, ?, ?, 1)', [conv.lastInsertRowid, userIds[0], 'Walaikum Assalam! Yes, it is.']);
    pool.query('INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)', [conv.lastInsertRowid, userIds[1], 'What is the final price?']);
  }
  console.log(`Database seeded with ${allAds.length} products`);
}

module.exports = { seed };
