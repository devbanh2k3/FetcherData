const fs = require('fs'); // Import module File System

// Đọc nội dung từ file input.txt
const text = fs.readFileSync('input.txt', 'utf8');

// Regex để tìm các liên kết
const regex = /https?:\/\/(?:www\.)?facebook\.com\/share\/v\/[^\s/?]+/g;

// Tìm tất cả các liên kết
const links = text.match(regex);

// Kiểm tra nếu có link
if (links && links.length > 0) {
  // Ghi ra file links.txt
  fs.writeFileSync('links.txt', links.join('\n'), 'utf8');
  console.log('Các liên kết đã được ghi vào file links.txt');
} else {
  console.log('Không tìm thấy liên kết nào.');
}
