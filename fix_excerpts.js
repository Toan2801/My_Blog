const fs = require('fs');
const path = require('path');

const updates = [
  {
    f: 'minhthonggiam-chinhbien048.json',
    e: 'Năm Kỷ Mão (1519), Chính Đức năm thứ 14: Vua Chính Đức trở về kinh từ Thái Nguyên, rồi quyết ý nam tuần. Quần thần hơn trăm người quỳ trước cửa Ngọ khóc gián, bị đánh trượng hàng loạt, 11 người chết. Ninh vương Chu Thần Hào phản loạn ở Giang Tây, giết Tuần phủ Tôn Toại, Phó sứ Hứa Quỳ. Vương Thủ Nhân dấy binh đánh dẹp.'
  },
  {
    f: 'minhthonggiam-chinhbien050.json',
    e: 'Hai năm Nhâm Ngọ - Quý Mùi (1522-1523), đầu triều Gia Tĩnh: Thế Tông lên ngôi, tranh luận Đại Lễ Nghị bùng nổ về việc truy tôn cha ruột Hưng Hiến Vương. Dương Đình Hòa, Mao Trừng cùng đình thần kiên quyết phản đối xưng "Hoàng khảo". Vương Thủ Nhân từ phong tước, biện oan cho công thần. Lập Hoàng hậu Trần thị.'
  },
  {
    f: 'minhthonggiam-chinhbien076.json',
    e: 'Hai năm Kỷ Mùi - Canh Thân (1619-1620), cuối triều Vạn Lịch: Dương Cảo phát động trận Tát Nhĩ Hử, chia 4 đường đánh quân Đại Thanh (Hậu Kim) nhưng đại bại, Đỗ Tùng, Lưu Đĩnh tử trận, Mã Lâm thoát chết. Hùng Đình Bật được khởi dùng Kinh lược Liêu Đông, chỉnh đốn phòng thủ. Thần Tông băng, Quang Tông nối ngôi rồi cũng sớm mất.'
  }
];

updates.forEach(u => {
  const p = path.join('data', 'articles', u.f);
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.excerpt = u.e;
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
  console.log('Updated: ' + u.f + ' -> ' + d.excerpt.length + ' chars');
});
