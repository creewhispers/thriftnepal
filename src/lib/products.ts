import tee from "@/assets/p-tee.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import cargo from "@/assets/p-cargo.jpg";
import bag from "@/assets/p-bag.jpg";
import hoodie from "@/assets/p-hoodie.jpg";
import jacket from "@/assets/p-jacket.jpg";
import jewelry from "@/assets/p-jewelry.jpg";

export type Product = {
  id: string;
  title: string;
  brand: string;
  size: string;
  condition: "New" | "Like New" | "Good" | "Worn";
  price: number; // NPR
  location: string;
  category: string;
  image: string;
  seller: { name: string; handle: string; verified?: boolean; rating: number };
  tags: string[];
  likes: number;
};

export const products: Product[] = [
  {
    id: "1",
    title: "Vintage Nirvana Band Tee",
    brand: "Vintage",
    size: "L",
    condition: "Good",
    price: 1899,
    location: "Kathmandu",
    category: "Vintage Tees",
    image: tee,
    seller: { name: "Aayush K.", handle: "@aayush.thrift", verified: true, rating: 4.9 },
    tags: ["#vintage", "#90s", "#bandtee"],
    likes: 248,
  },
  {
    id: "2",
    title: "Chunky Dad Sneakers — Off White",
    brand: "Asics",
    size: "42",
    condition: "Like New",
    price: 5499,
    location: "Lalitpur",
    category: "Sneakers",
    image: sneakers,
    seller: { name: "Prerana S.", handle: "@prerana.fits", verified: true, rating: 5.0 },
    tags: ["#sneakers", "#streetwear"],
    likes: 412,
  },
  {
    id: "3",
    title: "Olive Cargo Pants — Wide Leg",
    brand: "Dickies",
    size: "32",
    condition: "Good",
    price: 2299,
    location: "Pokhara",
    category: "Cargo Pants",
    image: cargo,
    seller: { name: "Bibek R.", handle: "@bibek.archive", rating: 4.7 },
    tags: ["#cargo", "#y2k"],
    likes: 187,
  },
  {
    id: "4",
    title: "Leather Shoulder Bag — Cognac",
    brand: "Vintage Coach",
    size: "OS",
    condition: "Like New",
    price: 3299,
    location: "Bhaktapur",
    category: "Bags",
    image: bag,
    seller: { name: "Niharika M.", handle: "@nih.vintage", verified: true, rating: 4.8 },
    tags: ["#vintage", "#bags", "#leather"],
    likes: 322,
  },
  {
    id: "5",
    title: "Oversized Champion Hoodie",
    brand: "Champion",
    size: "XL",
    condition: "Good",
    price: 2499,
    location: "Kathmandu",
    category: "Hoodies",
    image: hoodie,
    seller: { name: "Sandesh T.", handle: "@sandesh.fit", rating: 4.6 },
    tags: ["#hoodie", "#streetwear"],
    likes: 156,
  },
  {
    id: "6",
    title: "Washed Denim Trucker Jacket",
    brand: "Levi's",
    size: "M",
    condition: "Worn",
    price: 1999,
    location: "Lalitpur",
    category: "Jackets",
    image: jacket,
    seller: { name: "Asmita G.", handle: "@asmita.rewear", verified: true, rating: 4.9 },
    tags: ["#denim", "#vintage"],
    likes: 289,
  },
  {
    id: "7",
    title: "Sterling Silver Chain Set",
    brand: "Handmade",
    size: "OS",
    condition: "New",
    price: 1599,
    location: "Kathmandu",
    category: "Jewelry",
    image: jewelry,
    seller: { name: "Rojina P.", handle: "@rojina.silver", rating: 4.8 },
    tags: ["#jewelry", "#handmade", "#silver"],
    likes: 201,
  },
  {
    id: "8",
    title: "Y2K Mesh Layer Top",
    brand: "Vintage",
    size: "S",
    condition: "Like New",
    price: 1299,
    location: "Pokhara",
    category: "Women's",
    image: tee,
    seller: { name: "Sneha L.", handle: "@sneha.y2k", verified: true, rating: 5.0 },
    tags: ["#y2k", "#mesh"],
    likes: 367,
  },
];

export const categories = [
  "Hoodies", "Vintage Tees", "Sneakers", "Cargo Pants",
  "Jackets", "Jewelry", "Bags", "Handmade", "Women's", "Men's",
];

export const formatNPR = (n: number) =>
  "रू " + n.toLocaleString("en-IN");
