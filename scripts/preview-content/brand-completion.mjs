// Client request 2026-10-05. Keep legacy website figures separate from dated profiles.
export function completeBrandContent(items, entry) {
  const get = (resource, key) =>
    items.find((item) => item.resource === resource && item.key === key);
  const add = (item, vi, en) => {
    if (!item) return;
    for (const [locale, sections] of Object.entries({ vi, en })) {
      for (const [heading, ...paragraphs] of sections)
        item.translations[locale].content.content.push(
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: heading }],
          },
          ...paragraphs.map((text) => ({
            type: "paragraph",
            content: [{ type: "text", text }],
          })),
        );
    }
  };
  const archiveVi = [
    [
      "Quy mô trong website trước đây",
      "Tư liệu website cũ giới thiệu 3.000 cán bộ công nhân viên, được đào tạo và bồi dưỡng thường xuyên; hơn 2.800 máy móc thiết bị; 1.000.000 jacket/năm và 2.000.000 sơ mi/quần/năm. Nguồn này không ghi năm đối chiếu; các số liệu được giữ như một bản ghi lịch sử, không gộp với hồ sơ 2022–2023.",
    ],
    [
      "Bốn xí nghiệp trong tư liệu cũ",
      "Xí nghiệp may 123: 600 công nhân, 550 máy. Xí nghiệp may 45 (Summit Garment Saigon): 1.300 cán bộ công nhân viên, 1.200 máy; hợp tác với Sumitex International Co., thuộc Sumitomo Corporation, Nhật Bản.",
      "Xí nghiệp may 6 tại Sa Đéc, Đồng Tháp: 4 phân xưởng sản xuất, 1.100 công nhân, 1.000 máy. Xí nghiệp may 7 tại Phước Lâm, Cần Giuộc, Long An: 1.100 công nhân, 1.000 máy. Các địa danh và quy mô thuộc nguồn lịch sử, không khẳng định địa chỉ hành chính hay năng lực hiện tại.",
    ],
  ];
  const archiveEn = [
    [
      "Scale recorded on the earlier website",
      "The earlier website described 3,000 regularly trained staff, over 2,800 machines, 1,000,000 jackets/year and 2,000,000 shirts/pants/year. No reference year was given. These figures remain a historical snapshot, separate from the 2022–2023 profile.",
    ],
    [
      "Four factories in the earlier material",
      "Factory 123: 600 workers and 550 machines. Factory 45 (Summit Garment Saigon): 1,300 staff and 1,200 machines, in cooperation with Sumitex International Co. of Sumitomo Corporation, Japan.",
      "Factory 6 in Sa Dec, Dong Thap: four production workshops, 1,100 workers and 1,000 machines. Factory 7 in Phuoc Lam, Can Giuoc, Long An: 1,100 workers and 1,000 machines. Locations and scale reflect the historical source, not current administrative addresses or capacity.",
    ],
  ];
  add(get("pages", "gioi-thieu"), archiveVi, archiveEn);
  add(get("pages", "nang-luc-san-xuat"), [archiveVi[1]], [archiveEn[1]]);
  add(
    get("pages", "gioi-thieu"),
    [
      [
        "Hàng may mặc cao cấp & dịch vụ",
        "Website trước đây giới thiệu sản xuất hàng may mặc cao cấp xuất khẩu: jacket, outerwear, sportswear, bộ trượt tuyết, ép đường may chống thấm, quần tây và thời trang; xuất nhập khẩu trực tiếp hàng may mặc, nguyên phụ liệu, máy móc, thiết bị và phụ tùng.",
      ],
      [
        "Hợp tác & đầu tư",
        "HUGAMEX sẵn sàng trao đổi hợp tác, liên kết và đầu tư với đối tác trong và ngoài nước trong các lĩnh vực được giới thiệu. Hoạt động cho thuê còn bao gồm máy móc, thiết bị ngành may và phương tiện vận tải đường bộ.",
      ],
      [
        "Phương châm kinh doanh",
        "Không ngừng nâng cao chất lượng sản phẩm, dịch vụ và quản lý có hiệu quả. Giữ vững, phát triển uy tín thương hiệu và thỏa mãn mọi cam kết với khách hàng là mục tiêu được doanh nghiệp nêu trong website trước đây.",
      ],
    ],
    [
      [
        "High-end garments & services",
        "The earlier website described high-end export garment production: jackets, outerwear, sportswear, ski wear, waterproof seam-sealed garments, tailored trousers and fashion, alongside direct import-export of garments, materials, machinery, equipment and spare parts.",
      ],
      [
        "Cooperation & investment",
        "HUGAMEX welcomes discussions of cooperation, business alliances and investment with domestic and international counterparts in its stated fields. Leasing activities also include garment machinery, equipment and road vehicles.",
      ],
      [
        "Business approach",
        "Continually improve product and service quality and effective management. Maintain and develop brand reputation and fulfil all customer commitments, as stated in the earlier company website.",
      ],
    ],
  );
  const partner = get("partners", "hop-tac-may-mac");
  partner.metadata = {
    ...partner.metadata,
    referenceYear: "2022",
    customerNames:
      "Columbia Sportswear|Toray Group|L.L.Bean|Lufian|Lacoste|Talbots",
    composition: "Columbia Sportswear:40|Sumitex International:36|Other:24",
  };
  for (const translation of Object.values(partner.translations)) {
    translation.content = JSON.parse(
      JSON.stringify(translation.content).replaceAll(
        "Torgay Group",
        "Toray Group",
      ),
    );
  }
  const quality = get("certifications", "ho-so-chat-luong");
  for (const translation of Object.values(quality.translations))
    translation.content.content = [];
  add(
    quality,
    [
      [
        "Giải thưởng quốc tế",
        "Arch of Europe: huy chương vàng về chất lượng Châu Âu, tư liệu cũ ghi tổ chức trao giải “J*ban Imagen Arte – Spain”. Giữ nguyên cách ghi của nguồn; tên tổ chức và chứng từ cần đối chiếu.",
        "GQM American Quality Award: huy chương vàng về tiêu chuẩn chất lượng Hoa Kỳ, do Global Quality Management trao tại New York, USA theo tư liệu cũ.",
      ],
      [
        "Giải thưởng trong nước — 2006",
        "Business Excellent Awards — Giải thưởng doanh nghiệp xuất sắc năm 2006.",
        "Doanh nghiệp có giải pháp thị trường xuất khẩu tốt nhất tại các nước và khu vực — năm 2006, do Ủy ban Quốc gia về Hợp tác Kinh tế Quốc tế và Báo Thương mại trao.",
        "Siêu cúp Thương hiệu mạnh & phát triển bền vững — năm 2006, do VCCI và Liên hiệp các Hội Khoa học & Kỹ thuật Việt Nam cấp.",
        "Cúp Sen Vàng Việt Nam và huy chương vàng hàng chất lượng cao, phù hợp tiêu chuẩn quốc tế — năm 2006, do VCCI và Liên hiệp các Hội Khoa học & Kỹ thuật Việt Nam trao.",
      ],
      [
        "Dấu mốc ngành dệt may — 2007",
        "Giải thưởng doanh nghiệp tiêu biểu ngành Dệt – May Việt Nam 2007: doanh nghiệp phát triển mặt hàng có tính khác biệt cao.",
      ],
      [
        "Chứng nhận trong tư liệu lịch sử",
        "Website cũ mô tả hệ thống quản lý chất lượng ISO 9001:2000 và chứng nhận trách nhiệm xã hội SA 8000 do BVQI (Anh Quốc) cấp, cùng các giải thưởng chất lượng tại hội chợ trong nước và quốc tế. Các mục này là tư liệu lịch sử; không suy diễn thành chứng nhận còn hiệu lực.",
      ],
    ],
    [
      [
        "International recognition",
        "Arch of Europe: a gold medal for European quality. The original material names the awarding body as “J*ban Imagen Arte – Spain”. This wording is retained pending checks against original documents.",
        "GQM American Quality Award: a gold medal for American quality standards, presented by Global Quality Management in New York, USA, according to the earlier material.",
      ],
      [
        "Domestic awards — 2006",
        "Business Excellent Awards — outstanding enterprise recognition in 2006.",
        "Best export-market solution for countries and regions — 2006, awarded by the National Committee for International Economic Cooperation and the Trade newspaper.",
        "Strong Brand & Sustainable Development Super Cup — 2006, awarded by VCCI and the Vietnam Union of Science and Technology Associations.",
        "Vietnam Golden Lotus Cup and gold medals for high-quality goods meeting international standards — 2006, awarded by VCCI and the Vietnam Union of Science and Technology Associations.",
      ],
      [
        "Garment industry milestone — 2007",
        "Representative Vietnamese textile and garment enterprise award in 2007 for developing highly differentiated products.",
      ],
      [
        "Historical certificate references",
        "The earlier website described ISO 9001:2000 quality management and SA 8000 social accountability certification issued by BVQI (United Kingdom), alongside quality awards at domestic and international fairs. These are historical records, not assertions of current certification.",
      ],
    ],
  );
  const technicalGroups = [
    [
      "nhom-the-thao",
      "Trang phục thể thao",
      "Sportswear",
      "Trang phục thể thao được giới thiệu trong tư liệu website trước đây.",
      "Sportswear described in earlier company website materials.",
      "sports",
    ],
    [
      "nhom-ky-thuat",
      "Trang phục kỹ thuật",
      "Technical garments",
      "Trang phục trượt tuyết và ép đường may chống thấm theo tư liệu lịch sử.",
      "Ski wear and waterproof seam-sealed garments described in historical materials.",
      "technical",
    ],
  ];
  for (const [key, vi, en, excerpt, enExcerpt, image] of technicalGroups)
    items.push(
      entry(
        "product-categories",
        key,
        [vi, excerpt, [[vi, excerpt]]],
        [en, enExcerpt, [[en, enExcerpt]]],
        {},
        image,
      ),
    );
  for (const [key, vi, en, group, image] of [
    [
      "trang-phuc-the-thao-ho-so",
      "Trang phục thể thao",
      "Sportswear",
      "nhom-the-thao",
      "sports",
    ],
    [
      "trang-phuc-truot-tuyet",
      "Trang phục trượt tuyết",
      "Ski wear",
      "nhom-ky-thuat",
      "ski",
    ],
    [
      "trang-phuc-chong-tham",
      "Trang phục ép đường may chống thấm",
      "Waterproof seam-sealed garments",
      "nhom-ky-thuat",
      "technical",
    ],
    [
      "quan-tay",
      "Quần tây & thời trang",
      "Tailored trousers & fashion",
      "nhom-quan-thoi-trang",
      "shorts",
    ],
  ])
    items.push(
      entry(
        "products",
        key,
        [
          vi,
          "Nhóm sản phẩm được giới thiệu trong tư liệu website trước đây; yêu cầu kỹ thuật được xác nhận khi trao đổi.",
          [
            [
              "Tham chiếu sản phẩm",
              `${vi} được mô tả trong tư liệu doanh nghiệp trước đây. Thông tin này giới thiệu nhóm chuyên môn, không phải danh mục bán lẻ hay cam kết năng lực hiện tại.`,
            ],
            [
              "Yêu cầu kỹ thuật",
              "Tư liệu cũ còn đề cập triển khai ép siêu âm không dùng chỉ may. Vui lòng chia sẻ thiết kế, vật liệu, tiêu chuẩn kiểm tra và thời gian dự kiến để xác nhận khả năng áp dụng.",
            ],
          ],
        ],
        [
          en,
          "A product family described in earlier website material; technical requirements are confirmed by enquiry.",
          [
            [
              "Product reference",
              `${en} were described in earlier company materials. This is a capability-family introduction, not a retail catalogue or current capacity commitment.`,
            ],
            [
              "Technical requirements",
              "The earlier material also mentioned the introduction of ultrasonic threadless sealing. Share designs, materials, evaluation standards and planned dates to confirm applicability.",
            ],
          ],
        ],
        {},
        image,
        group,
      ),
    );
  const imageMap = {
    pages: {
      "gioi-thieu": "history",
      "lich-su": "vision",
      "tam-nhin-su-menh": "fabricColour",
      "nang-luc-san-xuat": "production",
      "phat-trien-ben-vung": "sustainability",
      "tuyen-dung": "careers",
    },
    branches: {
      "xi-nghiep-may-123": "heroFactory",
      "xi-nghiep-may-45": "network",
      "xi-nghiep-may-6": "careers",
      "xi-nghiep-may-7": "production",
    },
    products: {
      "ao-khoac": "jacket",
      fleece: "sportswear",
      "so-mi": "shirts",
      "quan-thoi-trang": "trousers",
      "quan-short": "shorts",
      "ao-khoac-long-vu": "down",
      "trang-phuc-tre-nho": "children",
      "quan-tay": "trousers",
    },
    "product-categories": {
      "nhom-ao-khoac": "down",
      "nhom-fleece": "sportswear",
      "nhom-so-mi": "shirts",
      "nhom-quan-thoi-trang": "trousers",
      "nhom-trang-phuc-tre-nho": "children",
    },
    partners: { "hop-tac-may-mac": "cooperation" },
    certifications: { "ho-so-chat-luong": "finishing" },
  };
  const articleImages = [
    "fabricDetail",
    "cutting",
    "finishing",
    "fabricColour",
    "logistics",
    "technical",
  ];
  let n = 0;
  for (const item of items) {
    if (item.resource === "product-categories")
      item.featured = [
        "nhom-ao-khoac",
        "nhom-fleece",
        "nhom-so-mi",
        "nhom-quan-thoi-trang",
      ].includes(item.key);
    if (imageMap[item.resource]?.[item.key])
      item.image = imageMap[item.resource][item.key];
    if (item.resource === "posts")
      item.image = articleImages[n++ % articleImages.length];
  }
  return items;
}
