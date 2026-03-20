// 1. Dữ liệu từ dataset_full_merged.json (Đã sửa lỗi cấu trúc mảng)
const revenueData = [
    { "name": "('Quan 10 - Phường 15 - Chan Hung", "lat": 10.786223, "lng": 106.663304, "doanhthu": 173061144, "ahp": 0.91 },
    { "name": "('Quan 10 - Phường 15 - Cach Mang Thang 8", "lat": 10.78461, "lng": 106.6686, "doanhthu": 377917954, "ahp": 0.84 },
    { "name": "('Quan 10 - Phường 15 - Cach Mang Thang 8", "lat": 10.784412, "lng": 106.667849, "doanhthu": 252719724, "ahp": 0.94 },
    { "name": "('Quan 10 - Phường 15 - Trung Tam Quan 10", "lat": 10.784395, "lng": 106.665799, "doanhthu": 642758719, "ahp": 0.67 },
    { "name": "('Quan 10 - Phường 15 - Nguyen Duy Duong", "lat": 10.784247, "lng": 106.66561, "doanhthu": 169408385, "ahp": 0.8 },
    { "name": "('Quan 10 - Phường 15 - Ho Ba Kien", "lat": 10.784247, "lng": 106.66561, "doanhthu": 194968029, "ahp": 0.92 },
    { "name": "('Quan 10 - Phường 10 - Cach Mang Thang 8", "lat": 10.780901, "lng": 106.671823, "doanhthu": 519397051, "ahp": 0.87 },
    { "name": "('Quan 10 - Phường 10 - Cach Mang Thang 8", "lat": 10.780617, "lng": 106.674949, "doanhthu": 348329401, "ahp": 0.84 },
    { "name": "('Quan 10 - Phường 10 - Cach Mang Thang 8", "lat": 10.780391, "lng": 106.671507, "doanhthu": 262556693, "ahp": 0.87 },
    { "name": "('Quan 10 - Phường 10 - Cach Mang Thang 8", "lat": 10.780042, "lng": 106.675485, "doanhthu": 470485238, "ahp": 0.91 },
    { "name": "('Quan 10 - Phường 10 - Cach Mang Thang 8", "lat": 10.779532, "lng": 106.675164, "doanhthu": 284401393, "ahp": 0.83 },
    { "name": "('Quan 10 - Phường 13 - Hoa Hung", "lat": 10.779421, "lng": 106.671546, "doanhthu": 565659699, "ahp": 0.71 },
    { "name": "('Quan 10 - Phường 12 - Noi Bo", "lat": 10.779009, "lng": 106.675593, "doanhthu": 492022041, "ahp": 0.88 },
    { "name": "('Quan 10 - Phường 12 - 3 Thang 2", "lat": 10.776988, "lng": 106.68056, "doanhthu": 615094083, "ahp": 0.75 },
    { "name": "('Quan 10 - Phường 12 - 3 Thang 2", "lat": 10.776868, "lng": 106.680572, "doanhthu": 395382168, "ahp": 0.79 },
    { "name": "('Quan 10 - Phường 12 - Hem", "lat": 10.776111, "lng": 106.676818, "doanhthu": 355872967, "ahp": 0.92 },
    { "name": "('Quan 10 - Phường 10 - Mat Tien", "lat": 10.7759, "lng": 106.6718, "doanhthu": 516090318, "ahp": 0.74 },
    { "name": "('Quan 10 - Phường 12 - Hem 285", "lat": 10.775896, "lng": 106.677326, "doanhthu": 346059560, "ahp": 0.76 },
    { "name": "('Quan 10 - Phường 13 - Hoa Hung", "lat": 10.775396, "lng": 106.674644, "doanhthu": 533080193, "ahp": 0.83 },
    { "name": "('Quan 10 - Phường 11 - 3 Thang 2", "lat": 10.774289, "lng": 106.678632, "doanhthu": 546044706, "ahp": 0.86 },
    { "name": "('Quan 10 - Phường 11 - Noi Bo", "lat": 10.773924, "lng": 106.678475, "doanhthu": 389589526, "ahp": 0.78 },
    { "name": "('Quan 10 - Phường 10 - Dien Bien Phu", "lat": 10.773618, "lng": 106.679395, "doanhthu": 594779529, "ahp": 0.72 },
    { "name": "('Quan 10 - Phường 10 - Cao Thang", "lat": 10.77336, "lng": 106.678474, "doanhthu": 485846780, "ahp": 0.67 },
    { "name": "('Quan 10 - Phường 10 - Cao Thang", "lat": 10.773071, "lng": 106.678813, "doanhthu": 493434707, "ahp": 0.88 },
    { "name": "('Quan 10 - Phường 10 - Dien Bien Phu", "lat": 10.773049, "lng": 106.679302, "doanhthu": 355288154, "ahp": 0.92 },
    { "name": "('Quan 10 - Phường 10 - Cao Thang", "lat": 10.773046, "lng": 106.678796, "doanhthu": 483624508, "ahp": 0.83 },
    { "name": "('Quan 10 - Phường 11 - 3 Thang 2", "lat": 10.772677, "lng": 106.676699, "doanhthu": 450715894, "ahp": 0.8 },
    { "name": "('Quan 10 - Phường 10 - Cao Thang", "lat": 10.772626, "lng": 106.67904, "doanhthu": 382091526, "ahp": 0.85 },
    { "name": "('Quan 10 - Phường 8 - Ba Hat", "lat": 10.766898, "lng": 106.669322, "doanhthu": 497314859, "ahp": 0.67 },
    { "name": "('Quan 10 - Phường 9 - Nguyen Tri Phuong", "lat": 10.766892, "lng": 106.667704, "doanhthu": 418795684, "ahp": 0.87 },
    { "name": "('Quan 10 - Phường Vuon Lai - Ngo Gia Tu", "lat": 10.766327, "lng": 106.673256, "doanhthu": 610163849, "ahp": 0.94 },
    { "name": "('Quan 10 - Phường 9 - Ba Hat", "lat": 10.76618, "lng": 106.669203, "doanhthu": 573781069, "ahp": 0.76 },
    { "name": "('Quan 10 - Phường 10 - Ngo Gia Tu", "lat": 10.76608, "lng": 106.67305, "doanhthu": 644796692, "ahp": 0.94 },
    { "name": "('Quan 10 - Phường 1 - Ngo Gia Tu", "lat": 10.766058, "lng": 106.673073, "doanhthu": 630643513, "ahp": 0.66 },
    { "name": "('Quan 10 - Phường 10 - Le Hong Phong", "lat": 10.765428, "lng": 106.675739, "doanhthu": 290678319, "ahp": 0.75 },
    { "name": "('Quan 10 - Phường 8 - Nhat Tao", "lat": 10.764415, "lng": 106.666857, "doanhthu": 476196505, "ahp": 0.86 },
    { "name": "('Quan 10 - Phường 4 - Vinh Vien", "lat": 10.764016, "lng": 106.668381, "doanhthu": 646321631, "ahp": 0.85 },
    { "name": "('Quan 10 - Phường 5 - Nguyen Tieu La", "lat": 10.763929, "lng": 106.666973, "doanhthu": 186320540, "ahp": 0.86 },
    { "name": "('Quan 10 - Phường 4 - Vinh Vien", "lat": 10.76365, "lng": 106.666407, "doanhthu": 255612082, "ahp": 0.78 },
    { "name": "('Quan 10 - Phường 10 - Le Hong Phong", "lat": 10.763193, "lng": 106.675726, "doanhthu": 171409968, "ahp": 0.93 },
    { "name": "('Quan 10 - Phường 10 - Hung Vuong", "lat": 10.762456, "lng": 106.675986, "doanhthu": 260630277, "ahp": 0.69 },
    { "name": "('Quan 10 - Phường 10 - Ngo Gia Tu", "lat": 10.762348, "lng": 106.670637, "doanhthu": 618082024, "ahp": 0.75 },
    { "name": "('Quan 10 - Phường 10 - Tran Nhan Ton", "lat": 10.762225, "lng": 106.674938, "doanhthu": 166022760, "ahp": 0.88 },
    { "name": "('Quan 10 - Phường 10 - Hoa Hao", "lat": 10.76164, "lng": 106.667301, "doanhthu": 564863034, "ahp": 0.93 },
    { "name": "('Quan 10 - Phường 6 - Tran Van Kieu", "lat": 10.76614, "lng": 106.660719, "doanhthu": 377960944, "ahp": 0.76 },
    { "name": "('Quan 10 - Phường 6 - Nguyen Lam", "lat": 10.7643889, "lng": 106.6631667, "doanhthu": 646160338, "ahp": 0.9 },
    { "name": "('Quan 10 - Phường 8 - Nhat Tao", "lat": 10.7644149, "lng": 106.6668572, "doanhthu": 615205536, "ahp": 0.91 },
    { "name": "('Quan 10 - Phường 8 - Ba Hat", "lat": 10.765316, "lng": 106.664444, "doanhthu": 368225671, "ahp": 0.79 },
    { "name": "('Quan 10 - Phường 8 - Nhat Tao", "lat": 10.7644149, "lng": 106.6668572, "doanhthu": 174972372, "ahp": 0.71 },
    { "name": "('Quan 10 - Phường 6 - Nguyen Lam", "lat": 10.7643889, "lng": 106.6631667, "doanhthu": 512451579, "ahp": 0.92 },
    { "name": "('Quan 10 - Phường 4 - Vinh Vien", "lat": 10.763649, "lng": 106.666407, "doanhthu": 314363520, "ahp": 0.92 },
    { "name": "('Quan 11 - Phường 5 - Nhat Tao", "lat": 10.762147, "lng": 106.658620, "doanhthu": 213847599, "ahp": 0.86 },
    { "name": "('Quan 11 - Phường 6 - Le Dai Hanh", "lat": 10.761331, "lng": 106.657416, "doanhthu": 518269158, "ahp": 0.67 },
    { "name": "('Quan 11 - Phường 6 - Le Dai Hanh", "lat": 10.759518, "lng": 106.659540, "doanhthu": 560178866, "ahp": 0.66 },
    { "name": "Quận Bình Thạnh - Phường 12 - Nguyễn Xí", "lat": 10.814617, "lng": 106.706912, "doanhthu": 1582614957, "ahp": 0.89 },
    { "name": "Quận Bình Thạnh - Phường 12 - Nguyễn Xí", "lat": 10.814453, "lng": 106.707268, "doanhthu": 1715191565, "ahp": 0.79 },
    { "name": "Quận Bình Thạnh - Phường 12 - Khu dân cư", "lat": 10.814328, "lng": 106.70701, "doanhthu": 583508541, "ahp": 0.89 },
    { "name": "Quận Bình Thạnh - Phường 12 - Nguyễn Xí", "lat": 10.813523, "lng": 106.707194, "doanhthu": 1773118712, "ahp": 0.94 },
    { "name": "Quận Bình Thạnh - Phường 12 - Chu Văn An", "lat": 10.811453, "lng": 106.705375, "doanhthu": 1901027344, "ahp": 0.84 },
    { "name": "Quận Bình Thạnh - Phường 12 - Bùi Đình Túy", "lat": 10.810170, "lng": 106.702862, "doanhthu": 1387001058, "ahp": 0.89 },
    { "name": "Quận Bình Thạnh - Phường 12 - Bùi Đình Túy", "lat": 10.809552, "lng": 106.702855, "doanhthu": 656660212, "ahp": 0.88 },
    { "name": "Quận Bình Thạnh - Phường 12 - Bùi Đình Túy", "lat": 10.809542, "lng": 106.705854, "doanhthu": 2072039330, "ahp": 0.74 },
    { "name": "Quận Bình Thạnh - Phường 12 - Bùi Đình Túy", "lat": 10.8095, "lng": 106.706359, "doanhthu": 959523469, "ahp": 0.93 },
    { "name": "Quận Bình Thạnh - Phường 12 - Khu trung tâm", "lat": 10.808687, "lng": 106.70568, "doanhthu": 1585847256, "ahp": 0.83 },
    { "name": "Quận Bình Thạnh - Phường 12 - Khu trung tâm", "lat": 10.808639, "lng": 106.705722, "doanhthu": 726222570, "ahp": 0.73 },
    { "name": "Quận Bình Thạnh - Phường 12 - Bùi Đình Túy", "lat": 10.808221, "lng": 106.704720, "doanhthu": 1799644478, "ahp": 0.89 },
    { "name": "Quận 1 - Phường Bến Nghé - Công Xã Paris", "lat": 10.779253, "lng": 106.698917, "doanhthu": 753518561, "ahp": 0.67 },
    { "name": "Quận 1 - Chưa rõ - Chưa rõ", "lat": 10.774942, "lng": 106.696729, "doanhthu": 410959755, "ahp": 0.75 },
    { "name": "Quận 1 - Chưa rõ - Lý Thánh Tôn", "lat": 10.772504, "lng": 106.696014, "doanhthu": 241447872, "ahp": 0.7 },
    { "name": "Quận 1 - Chưa rõ - Hàm Nghi", "lat": 10.770731, "lng": 106.700657, "doanhthu": 1172317821, "ahp": 0.7 },
    { "name": "Quận 1 - Phường Nguyễn Thái Bình - Lê Công Kiều", "lat": 10.770542, "lng": 106.699524, "doanhthu": 427801186, "ahp": 0.71 },
    { "name": "Quận 1 - Phường Bến Thành - Nguyễn Trãi", "lat": 10.770412, "lng": 106.691377, "doanhthu": 840671737, "ahp": 0.61 },
    { "name": "Quận 1 - Phường Bến Thành - Chưa rõ", "lat": 10.770149, "lng": 106.689527, "doanhthu": 770003237, "ahp": 0.72 },
    { "name": "Quận 1 - Phường Nguyễn Thái Bình - Chưa rõ", "lat": 10.769283, "lng": 106.699006, "doanhthu": 886516586, "ahp": 0.71 },
    { "name": "Quận 3 - Chưa rõ - Nam Kỳ Khởi Nghĩa", "lat": 10.790551, "lng": 106.684303, "doanhthu": 589394225, "ahp": 0.94 },
    { "name": "Quận 3 - Chưa rõ - Nam Kỳ Khởi Nghĩa", "lat": 10.790487, "lng": 106.683397, "doanhthu": 972027761, "ahp": 0.66 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.790435, "lng": 106.677284, "doanhthu": 781026722, "ahp": 0.76 },
    { "name": "Quận 3 - Phường 8 - Lý Chính Thắng", "lat": 10.790353, "lng": 106.686673, "doanhthu": 739346978, "ahp": 0.77 },
    { "name": "Quận 3 - Phường 8 - Huỳnh Tịnh Của", "lat": 10.789057, "lng": 106.686601, "doanhthu": 590904962, "ahp": 0.66 },
    { "name": "Quận 3 - Phường 8 - Nam Kỳ Khởi Nghĩa", "lat": 10.78905, "lng": 106.6849, "doanhthu": 910644228, "ahp": 0.78 },
    { "name": "Quận 3 - Chưa rõ - Đinh Công Tráng", "lat": 10.78989, "lng": 106.691809, "doanhthu": 212120047, "ahp": 0.93 },
    { "name": "Quận 3 - Chưa rõ - Đinh Công Tráng", "lat": 10.788944, "lng": 106.691811, "doanhthu": 942748773, "ahp": 0.81 },
    { "name": "Quận 3 - Phường 14 - Trần Quang Diệu", "lat": 10.788682, "lng": 106.67784, "doanhthu": 390437577, "ahp": 0.81 },
    { "name": "Quận 3 - Chưa rõ - Trần Quang Diệu", "lat": 10.788577, "lng": 106.680358, "doanhthu": 886848931, "ahp": 0.62 },
    { "name": "Quận 3 - Phường 14 - Chưa rõ", "lat": 10.788294, "lng": 106.680141, "doanhthu": 252859432, "ahp": 0.74 },
    { "name": "Quận 3 - Chưa rõ - Hai Bà Trưng", "lat": 10.787972, "lng": 106.691583, "doanhthu": 222565702, "ahp": 0.78 },
    { "name": "Quận 3 - Phường 14 - Lê Văn Sỹ", "lat": 10.787759, "lng": 106.680423, "doanhthu": 1053990829, "ahp": 0.62 },
    { "name": "Quận 3 - Phường 13 - Lê Văn Sỹ", "lat": 10.787639, "lng": 106.677944, "doanhthu": 279843429, "ahp": 0.71 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.787534, "lng": 106.684427, "doanhthu": 1061806421, "ahp": 0.93 },
    { "name": "Quận 3 - Phường 14 - Lê Văn Sỹ", "lat": 10.787497, "lng": 106.678768, "doanhthu": 370727951, "ahp": 0.84 },
    { "name": "Quận 3 - Phường 14 - Lê Văn Sỹ", "lat": 10.787412, "lng": 106.682004, "doanhthu": 1135291439, "ahp": 0.67 },
    { "name": "Quận 3 - Chưa rõ - Lý Chính Thắng", "lat": 10.787347, "lng": 106.684380, "doanhthu": 977114413, "ahp": 0.9 },
    { "name": "Quận 3 - Phường 14 - Lê Văn Sỹ", "lat": 10.78717, "lng": 106.681794, "doanhthu": 1088026613, "ahp": 0.64 },
    { "name": "Quận 3 - Phường 8 - Võ Thị Sáu", "lat": 10.787149, "lng": 106.690842, "doanhthu": 1032838528, "ahp": 0.73 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.78691, "lng": 106.68409, "doanhthu": 624877066, "ahp": 0.92 },
    { "name": "Quận 3 - Chưa rõ - Trần Quốc Thảo", "lat": 10.784547, "lng": 106.684432, "doanhthu": 1090437879, "ahp": 0.85 },
    { "name": "Quận 3 - Chưa rõ - Hoàng Sa", "lat": 10.783917, "lng": 106.679889, "doanhthu": 1165578595, "ahp": 0.77 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.783160, "lng": 106.680671, "doanhthu": 551339885, "ahp": 0.74 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.782965, "lng": 106.683553, "doanhthu": 631640760, "ahp": 0.64 },
    { "name": "Quận 3 - Chưa rõ - Bà Huyện Thanh Quan", "lat": 10.782444, "lng": 106.680494, "doanhthu": 944498635, "ahp": 0.66 },
    { "name": "Quận 3 - Chưa rõ - Chưa rõ", "lat": 10.782337, "lng": 106.680762, "doanhthu": 212485678, "ahp": 0.75 },
    { "name": "Quận 3 - Chưa rõ - Lê Quý Đôn", "lat": 10.78002, "lng": 106.69195, "doanhthu": 324438658, "ahp": 0.66 },
    { "name": "Quận 3 - Phường 10 - Chưa rõ", "lat": 10.779732, "lng": 106.680159, "doanhthu": 255949364, "ahp": 0.71 },
    { "name": "Quận 3 - Chưa rõ - Ngô Thời Nhiệm", "lat": 10.778531, "lng": 106.688121, "doanhthu": 390193247, "ahp": 0.86 },
    { "name": "Quận 3 - Chưa rõ - Ngô Thời Nhiệm", "lat": 10.778504, "lng": 106.688002, "doanhthu": 682931911, "ahp": 0.66 },
    { "name": "Quận 3 - Chưa rõ - Ngô Thời Nhiệm", "lat": 10.778407, "lng": 106.688017, "doanhthu": 392387002, "ahp": 0.93 },
    { "name": "Quận 4 - Chưa rõ - Hoàng Diệu", "lat": 10.762702, "lng": 106.703194, "doanhthu": 961734993, "ahp": 0.74 },
    { "name": "Quận 4 - Chưa rõ - Chưa rõ", "lat": 10.760828, "lng": 106.699786, "doanhthu": 751673968, "ahp": 0.85 },
    { "name": "Quận 4 - Chưa rõ - Bến Vân Đồn", "lat": 10.758455, "lng": 106.694062, "doanhthu": 437611292, "ahp": 0.94 },
    { "name": "Quận 4 - Chưa rõ - Bến Vân Đồn", "lat": 10.758047, "lng": 106.693888, "doanhthu": 580248794, "ahp": 0.75 },
    { "name": "Quận 4 - Chưa rõ - Chưa rõ", "lat": 10.757663, "lng": 106.694709, "doanhthu": 581677174, "ahp": 0.68 },
    { "name": "Quận 4 - Phường 4 - Chưa rõ", "lat": 10.757306, "lng": 106.703694, "doanhthu": 643753596, "ahp": 0.67 },
    { "name": "Quận 4 - Phường 4 - Chưa rõ", "lat": 10.756258, "lng": 106.703251, "doanhthu": 673238166, "ahp": 0.71 },
    { "name": "Quận 4 - Phường 15 - Chưa rõ", "lat": 10.755039, "lng": 106.707735, "doanhthu": 635652201, "ahp": 0.76 },
    { "name": "Quận 4 - Chưa rõ - Chưa rõ", "lat": 10.754676, "lng": 106.702635, "doanhthu": 270744155, "ahp": 0.69 },
    { "name": "Quận 5 - Chưa rõ - An Dương Vương", "lat": 10.756712, "lng": 106.670607, "doanhthu": 727697281, "ahp": 0.77 },
    { "name": "Quận 5 - Phường 8 - An Dương Vương", "lat": 10.755069, "lng": 106.670622, "doanhthu": 1182908870, "ahp": 0.77 },
    { "name": "Quận 5 - Phường 11 - Trần Hưng Đạo", "lat": 10.752218, "lng": 106.660821, "doanhthu": 326291281, "ahp": 0.77 }
];

// 2. Khởi tạo bản đồ
const map = L.map('map').setView([10.7769, 106.7009], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 3. Hàm tiện ích
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

function getColor(rev) {
    if (rev > 1500000000) return '#b91c1c'; // Đỏ (Rất cao)
    if (rev > 1000000000) return '#ea580c'; // Cam (Cao)
    if (rev > 500000000) return '#facc15'; // Vàng (Trung bình)
    return '#22c55e'; // Xanh lá (Thấp)
}

// 4. Render dữ liệu
function renderMap() {
    let totalRevenue = 0;
    const allLatLngs = []; // Mảng chứa tất cả tọa độ để tính ranh giới

    // 1. Vòng lặp vẽ các điểm nhỏ
    revenueData.forEach(item => {
        const cleanName = item.name.replace(/^\('\s*/, '');
        totalRevenue += item.doanhthu;

        // Lưu tọa độ vào mảng chung
        allLatLngs.push([item.lat, item.lng]);

        // Kích thước điểm
        const bigRadius = 8 + (item.doanhthu / 500000000);

        const circle = L.circleMarker([item.lat, item.lng], {
            radius: bigRadius,
            fillColor: getColor(item.doanhthu),
            color: "#ffffff",
            weight: 2,
            fillOpacity: 0.8
        }).addTo(map);

        // Nội dung Popup (Nút liên hệ và Satellite View)
        const popupContent = `
            <div class="popup-name">${cleanName}</div>
            <div class="popup-price">Doanh thu: ${formatCurrency(item.doanhthu)}</div>
            <div style="margin-top:4px; font-size: 0.75rem;">Chỉ số AHP: <strong>${item.ahp}</strong></div>
            
            <div style="text-align:center;">
                <a href="contact.html?location=${encodeURIComponent(cleanName)}" target="_blank" class="btn-contact">
                    📞 Liên hệ
                </a>
                <a href="#" class="btn-streetview" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${cleanName}">
                    🛰️ Xem bản đồ 
                </a>
            </div>
        `;

        const popup = L.popup({
            offset: L.point(0, -5),
            closeButton: false,
            autoPan: false
        }).setContent(popupContent);

        circle.bindPopup(popup);

        // Xử lý Hover - Popup sẽ đóng sau 2 giây
        let timer;
        circle.on('mouseover', function (e) {
            if (timer) clearTimeout(timer);
            this.setStyle({ weight: 4, fillOpacity: 1 });
            this.openPopup();
        });
        circle.on('mouseout', function (e) {
            this.setStyle({ weight: 2, fillOpacity: 0.8 });
            timer = setTimeout(() => { this.closePopup(); }, 2000); // Tăng từ 300ms lên 2000ms
        });
    });

    // 2. VẼ VÒNG TRÒN RANH GIỚI (Mới thêm)
    if (allLatLngs.length > 0) {
        // Tạo một khung hình chữ nhật bao trọn tất cả các điểm
        const bounds = L.latLngBounds(allLatLngs);

        // Tìm tâm của khung đó
        const center = bounds.getCenter();

        // Tính khoảng cách từ tâm đến góc xa nhất để làm bán kính
        const northEast = bounds.getNorthEast();
        const radius = map.distance(center, northEast);

        // Vẽ vòng tròn bao quanh
        L.circle(center, {
            radius: radius + 500, // Cộng thêm 500m để rộng rãi hơn chút
            color: '#3b82f6',     // Màu xanh dương nhạt
            weight: 1,            // Viền mảnh
            dashArray: '10, 10',  // Viền nét đứt (tạo cảm giác ranh giới)
            fillColor: '#3b82f6',
            fillOpacity: 0.05,    // Màu nền rất mờ
            interactive: false    // Không cho click vào vòng tròn này (để click xuyên qua)
        }).addTo(map);

        // Tự động zoom bản đồ để thấy hết ranh giới
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 3. Cập nhật thống kê
    document.getElementById('total-locations').innerText = revenueData.length;
    document.getElementById('avg-revenue').innerText = formatCurrency(Math.round(totalRevenue / revenueData.length));

    updateLegend();
}

function updateLegend() {
    const grades = [
        { label: '> 1.5 tỷ VNĐ', color: '#b91c1c' },
        { label: '1 - 1.5 tỷ VNĐ', color: '#ea580c' },
        { label: '500tr - 1 tỷ VNĐ', color: '#facc15' },
        { label: '< 500tr VNĐ', color: '#22c55e' }
    ];

    const container = document.getElementById('legend-list');
    container.innerHTML = '';
    grades.forEach(g => {
        container.innerHTML += `
            <div class="legend-item">
                <div class="color-box" style="background:${g.color}"></div>
                <span>${g.label}</span>
            </div>
        `;
    });
}

// Chạy hàm render ngay khi load xong script
renderMap();


let searchCircle = null; // Biến lưu vòng tròn tìm kiếm hiện tại
let currentFilters = {
    quan: '',
    phuong: '',
    diachi: ''
};

// Parse dữ liệu để tạo options cho TomSelect
function parseLocationData() {
    const parsedData = revenueData.map((item, index) => {
        const cleanName = item.name.replace(/^\('\s*/, '');
        const parts = cleanName.split(' - ');

        return {
            id: index,
            ten: cleanName,
            quan: parts[0] || '',
            phuong: parts[1] || '',
            duong: parts[2] || '',
            lat: item.lat,
            lng: item.lng,
            doanhthu: item.doanhthu,
            ahp: item.ahp
        };
    });

    return parsedData;
}

// Lấy danh sách unique cho mỗi loại
function getUniqueOptions(data, field) {
    const unique = [...new Set(data.map(item => item[field]))].filter(Boolean);
    return unique.sort().map((value, index) => ({
        id: index,
        name: value
    }));
}

// Lọc dữ liệu dựa trên filters hiện tại
function getFilteredData(locationData) {
    return locationData.filter(item => {
        const matchQuan = !currentFilters.quan || item.quan === currentFilters.quan;
        const matchPhuong = !currentFilters.phuong || item.phuong === currentFilters.phuong;
        const matchDiaChi = !currentFilters.diachi || item.duong === currentFilters.diachi;

        return matchQuan && matchPhuong && matchDiaChi;
    });
}

// Zoom bản đồ đến các địa điểm phù hợp
function zoomToFilteredLocations() {
    const locationData = parseLocationData();
    const filteredData = getFilteredData(locationData);

    // Xóa vòng tròn cũ
    if (searchCircle) {
        map.removeLayer(searchCircle);
        searchCircle = null;
    }

    // Nếu không có filter nào, quay lại view ban đầu
    if (!currentFilters.quan && !currentFilters.phuong && !currentFilters.diachi) {
        const allLatLngs = revenueData.map(item => [item.lat, item.lng]);
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds, { padding: [50, 50] });
        return;
    }

    if (filteredData.length === 0) return;

    // Tạo mảng tọa độ của các địa điểm phù hợp
    const matchedLatLngs = filteredData.map(item => [item.lat, item.lng]);

    // Tính bounds
    const bounds = L.latLngBounds(matchedLatLngs);
    const center = bounds.getCenter();
    const northEast = bounds.getNorthEast();
    const radius = map.distance(center, northEast);

    // Vẽ vòng tròn mới
    searchCircle = L.circle(center, {
        radius: radius + 300,
        color: '#ef4444',
        weight: 2,
        dashArray: '8, 8',
        fillColor: '#ef4444',
        fillOpacity: 0.1,
        interactive: false
    }).addTo(map);

    // Zoom đến khu vực
    map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
        animate: true,
        duration: 0.5
    });
}

// Cập nhật options cho các dropdown dựa trên filter hiện tại
function updateDropdownOptions(locationData, changedField) {
    const filteredData = getFilteredData(locationData);

    // Cập nhật dropdown Phường nếu Quận thay đổi
    if (changedField === 'quan' || changedField === 'init') {
        const phuongOptions = getUniqueOptions(filteredData, 'phuong');
        if (window.searchPhuong) {
            window.searchPhuong.clearOptions();
            window.searchPhuong.addOption(phuongOptions.map(opt => ({
                id: opt.name,
                name: opt.name
            })));
            window.searchPhuong.refreshOptions(false);
        }
    }

    // Cập nhật dropdown Địa chỉ nếu Quận hoặc Phường thay đổi
    if (changedField === 'quan' || changedField === 'phuong' || changedField === 'init') {
        const diachiOptions = getUniqueOptions(filteredData, 'duong');
        if (window.searchDiaChi) {
            window.searchDiaChi.clearOptions();
            window.searchDiaChi.addOption(diachiOptions.map(opt => ({
                id: opt.name,
                name: opt.name
            })));
            window.searchDiaChi.refreshOptions(false);
        }
    }
}

// Khởi tạo TomSelect
function initializeSearch() {
    const locationData = parseLocationData();

    // Lấy danh sách unique
    const quanOptions = getUniqueOptions(locationData, 'quan');
    const phuongOptions = getUniqueOptions(locationData, 'phuong');
    const diachiOptions = getUniqueOptions(locationData, 'duong');

    // TomSelect cho Quận
    window.searchQuan = new TomSelect('#search-quan', {
        options: quanOptions.map(opt => ({ id: opt.name, name: opt.name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn quận...',
        allowEmptyOption: true,

        onChange: function (value) {
            currentFilters.quan = value || '';
            currentFilters.phuong = ''; // Reset phường
            currentFilters.diachi = ''; // Reset địa chỉ

            // Clear các dropdown con
            if (window.searchPhuong) window.searchPhuong.clear();
            if (window.searchDiaChi) window.searchDiaChi.clear();

            // Enable/disable dropdown Phường
            if (value) {
                window.searchPhuong.enable();
            } else {
                window.searchPhuong.disable();
            }

            updateDropdownOptions(locationData, 'quan');
            zoomToFilteredLocations();
        }
    });

    // TomSelect cho Phường
    window.searchPhuong = new TomSelect('#search-phuong', {
        options: phuongOptions.map(opt => ({ id: opt.name, name: opt.name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn phường...',
        allowEmptyOption: true,

        onChange: function (value) {
            currentFilters.phuong = value || '';
            currentFilters.diachi = ''; // Reset địa chỉ

            // Clear dropdown địa chỉ
            if (window.searchDiaChi) window.searchDiaChi.clear();

            updateDropdownOptions(locationData, 'phuong');
            zoomToFilteredLocations();
        }
    });

    // Disable Phường ban đầu (chưa chọn Quận)
    window.searchPhuong.disable();

    // TomSelect cho Địa chỉ
    window.searchDiaChi = new TomSelect('#search-diachi', {
        options: diachiOptions.map(opt => ({ id: opt.name, name: opt.name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn địa chỉ...',
        allowEmptyOption: true,

        onChange: function (value) {
            currentFilters.diachi = value || '';
            zoomToFilteredLocations();
        }
    });
}

// Khởi tạo search sau khi DOM đã load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    initializeSearch();
}

// ============================================
// 6. MAPTILER SATELLITE VIEW (100% FREE)
// ============================================

let satelliteMap = null;
const MAPTILER_KEY = '3nRFtGdZX0hd7MAdFM0g';

// Mở Satellite View modal
function openStreetView(lat, lng, locationName) {
    const modal = document.getElementById('streetview-modal');
    const backdrop = document.getElementById('streetview-backdrop');
    const title = document.getElementById('streetview-title');

    // Hiển thị modal và backdrop
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    // Cập nhật title
    title.textContent = `Bản đồ vệ tinh 3D - ${locationName}`;

    // Khởi tạo Satellite Map
    initSatelliteMap(lat, lng);
}

// Đóng Satellite View modal
function closeStreetView() {
    const modal = document.getElementById('streetview-modal');
    const backdrop = document.getElementById('streetview-backdrop');

    modal.classList.add('hidden');
    backdrop.classList.add('hidden');

    // Xóa map để giải phóng bộ nhớ
    if (satelliteMap) {
        satelliteMap.remove();
        satelliteMap = null;
    }
}

// Khởi tạo MapLibre Satellite Map
function initSatelliteMap(lat, lng) {
    const container = document.getElementById('streetview-container');

    // Kiểm tra xem MapLibre đã load chưa
    if (typeof maplibregl === 'undefined') {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">Lỗi tải thư viện bản đồ</div>
                <div style="font-size: 0.9rem;">Vui lòng kiểm tra kết nối internet và thử lại.</div>
            </div>
        `;
        return;
    }

    // Xóa map cũ nếu có
    if (satelliteMap) {
        satelliteMap.remove();
    }

    // Clear container
    container.innerHTML = '';

    try {
        // Tạo MapLibre map với Maptiler satellite tiles
        satelliteMap = new maplibregl.Map({
            container: 'streetview-container',
            style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
            center: [lng, lat],
            zoom: 19, // Zoom tối đa
            pitch: 30, // Giảm xuống 30 độ để rõ hơn
            bearing: 0,
            antialias: true,
            maxPitch: 85
        });

        // Thêm navigation controls
        satelliteMap.addControl(new maplibregl.NavigationControl({
            visualizePitch: true
        }), 'top-right');

        // Thêm fullscreen control
        satelliteMap.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Thêm scale control
        satelliteMap.addControl(new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');

        // Thêm marker tại vị trí
        const primaryColor = '#0284c7';
        const marker = new maplibregl.Marker({
            color: primaryColor
        })
            .setLngLat([lng, lat])
            .addTo(satelliteMap);

        // Thêm popup cho marker
        const popup = new maplibregl.Popup({ offset: 25 })
            .setHTML(`<div style="font-weight: 600; color: #0f172a;">📍 Vị trí này</div>`);
        marker.setPopup(popup);

        // Enable 3D terrain khi map load xong
        satelliteMap.on('load', function () {
            // Thêm 3D terrain source
            satelliteMap.addSource('terrain', {
                type: 'raster-dem',
                url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
                tileSize: 256
            });

            // Set terrain
            satelliteMap.setTerrain({
                source: 'terrain',
                exaggeration: 1.5
            });

            // Thêm 3D buildings
            const layers = satelliteMap.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            )?.id;

            if (labelLayerId) {
                satelliteMap.addLayer({
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': '#aaa',
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                }, labelLayerId);
            }
        });

        // Xử lý lỗi
        satelliteMap.on('error', function (e) {
            console.error('MapLibre error:', e);
        });

    } catch (error) {
        console.error('Error initializing satellite map:', error);
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">Không thể tải bản đồ</div>
                <div style="font-size: 0.9rem;">Vui lòng thử lại sau.</div>
            </div>
        `;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Đóng modal khi click vào nút close
    const closeBtn = document.getElementById('streetview-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeStreetView);
    }

    // Đóng modal khi click vào backdrop
    const backdrop = document.getElementById('streetview-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeStreetView);
    }

    // Đóng modal khi nhấn ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('streetview-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeStreetView();
            }
        }
    });
});

// Event delegation cho nút Satellite View (vì popup được tạo động)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-streetview')) {
        e.preventDefault();
        const lat = parseFloat(e.target.getAttribute('data-lat'));
        const lng = parseFloat(e.target.getAttribute('data-lng'));
        const name = e.target.getAttribute('data-name');

        if (lat && lng) {
            openStreetView(lat, lng, name);
        }
    }
});
