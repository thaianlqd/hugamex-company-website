// Original editorial preview copy. Owner approval and source audit: docs/CONTENT_SOURCES.md.
// Titles, prose and translations are imported by the guarded seed tool, never hardcoded in React.
import { enrichArticle } from "./article-copy.mjs";
const doc = (sections) => ({
  type: "doc",
  content: sections.flatMap(([heading, ...paragraphs]) => [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: heading }],
    },
    ...paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  ]),
});
const entry = (
  resource,
  key,
  vi,
  en,
  metadata = {},
  image = "textile",
  category = null,
) => ({
  resource,
  key,
  metadata,
  image,
  category,
  translations: {
    vi: {
      title: vi[0],
      excerpt: vi[1],
      content:
        resource === "posts"
          ? enrichArticle(doc(vi[2]), key, "vi")
          : doc(vi[2]),
    },
    en: {
      title: en[0],
      excerpt: en[1],
      content:
        resource === "posts"
          ? enrichArticle(doc(en[2]), key, "en")
          : doc(en[2]),
    },
  },
});
const previewCatalog = [
  entry(
    "pages",
    "gioi-thieu",
    [
      "HUGAMEX. Câu chuyện từ đường kim.",
      "Công ty Cổ phần May Hữu Nghị — một góc nhìn về sản phẩm, chất liệu và sự chỉn chu trong nghề may.",
      [
        [
          "May mặc là điểm khởi đầu",
          "HUGAMEX là tên thương hiệu của Công ty Cổ phần May Hữu Nghị. Thông tin giới thiệu trên website doanh nghiệp đề cập lĩnh vực sản xuất và xuất nhập khẩu hàng may mặc.",
          "Trong phiên bản website này, câu chuyện được mở ra từ những điều gần gũi: chất liệu, đường may và cách trao đổi về một sản phẩm. Các hồ sơ kỹ thuật cụ thể được làm rõ theo nhu cầu của từng cuộc trao đổi.",
        ],
        [
          "Sản phẩm và chất liệu",
          "Nhóm sản phẩm được giới thiệu gồm áo khoác, trang phục thể thao và quần. Mỗi nhóm có những yêu cầu khác nhau về cấu trúc, độ thoải mái và bề mặt hoàn thiện.",
          "Một mẫu đối chiếu cùng thông số rõ ràng giúp người thiết kế và người thực hiện trao đổi chính xác hơn. Xem danh mục để bắt đầu từ nhóm sản phẩm phù hợp với nhu cầu của bạn.",
        ],
        [
          "Giá trị của sự chỉn chu",
          "Một sản phẩm may mặc là sự kết hợp của nhiều công đoạn. Sự nhất quán giữa thiết kế, vật liệu và kiểm tra giúp các chi tiết cùng phục vụ mục đích sử dụng.",
          "Những góc nhìn về nghề may trên website tập trung vào cách đặt câu hỏi và làm rõ yêu cầu. Đây là nền tảng để cuộc trao đổi về sản phẩm có chiều sâu hơn.",
        ],
        [
          "Bắt đầu từ một cuộc trao đổi",
          "Hãy chia sẻ nhóm sản phẩm, ý tưởng thiết kế, thời gian dự kiến và các yêu cầu kỹ thuật cần làm rõ. Thông tin ban đầu càng đầy đủ, cuộc trao đổi càng dễ đi vào chi tiết.",
          "Bạn có thể tìm hiểu thêm về câu chuyện doanh nghiệp, quy trình ngành may hoặc gửi yêu cầu qua trang liên hệ.",
        ],
      ],
    ],
    [
      "HUGAMEX. A story in every stitch.",
      "Huu Nghi Garment Joint Stock Company — perspectives on garments, materials and thoughtful making.",
      [
        [
          "A starting point in garments",
          "HUGAMEX is the brand name of Huu Nghi Garment Joint Stock Company. The company introduction describes garment manufacturing and import and export activities.",
          "This website opens the conversation through materials, seams and product requirements. Specific technical details can be clarified around the needs of each enquiry.",
        ],
        [
          "Products and materials",
          "The presented product families include outerwear, sportswear and trousers. Each has distinct requirements for construction, comfort and finishing.",
          "Reference samples and clear specifications help designers and makers communicate more precisely. Explore the product families as a starting point for your requirements.",
        ],
        [
          "The value of attention",
          "A garment brings several stages together. Consistency between design, materials and inspection helps each detail serve its intended use.",
          "Our editorial perspectives focus on useful questions and clear requirements. They create a foundation for more informed product conversations.",
        ],
        [
          "Start a conversation",
          "Share your product family, design idea, intended schedule and technical questions. Complete initial information makes it easier to discuss the details.",
          "Explore the company story, learn about garment workflows or use the contact form to send an enquiry.",
        ],
      ],
    ],
    { routeKey: "gioi-thieu" },
  ),
  entry(
    "pages",
    "lich-su",
    [
      "Một câu chuyện được tiếp nối",
      "Nhìn lại doanh nghiệp qua sản phẩm, chuyên môn và những câu chuyện nghề may.",
      [
        [
          "Dấu ấn từ sản phẩm",
          "Câu chuyện của một doanh nghiệp may mặc có thể được đọc qua các nhóm sản phẩm và cách giới thiệu chuyên môn. Áo khoác, trang phục thể thao và quần là những điểm bắt đầu để tìm hiểu HUGAMEX.",
          "Trang này chọn cách kể theo chủ đề. Các mốc thời gian chỉ nên được bổ sung cùng hồ sơ và tư liệu có thể đối chiếu.",
        ],
        [
          "Chuyên môn qua từng chi tiết",
          "Từ cách chọn vật liệu đến bố trí đường may, mỗi chi tiết phản ánh những câu hỏi của người làm nghề. Một sản phẩm phù hợp bắt đầu bằng việc hiểu nhu cầu sử dụng.",
          "Sự thay đổi về thiết kế và vật liệu luôn mở ra những cuộc trao đổi mới. Những bài viết về nghề may giúp kết nối góc nhìn sản phẩm với các công đoạn thực hiện.",
        ],
        [
          "Hướng đến cuộc trao đổi tiếp theo",
          "Lịch sử cũng là cách hiểu hiện tại để chuẩn bị cho những bước tiếp theo. Thông tin rõ ràng và tư liệu chính xác giúp câu chuyện doanh nghiệp được kể nhất quán.",
          "Nếu cần hồ sơ giới thiệu doanh nghiệp cho một cuộc trao đổi cụ thể, hãy gửi yêu cầu qua trang liên hệ.",
        ],
      ],
    ],
    [
      "A story that continues",
      "Explore the company through its products, expertise and garment perspectives.",
      [
        [
          "A story through products",
          "A garment company can be understood through its product families and the way it presents expertise. Outerwear, sportswear and trousers are starting points for exploring HUGAMEX.",
          "This page follows themes rather than an unverified timeline. Dated milestones should be added with supporting company records.",
        ],
        [
          "Expertise in the details",
          "From material selection to seam placement, details reflect the questions makers ask. A suitable garment starts with an understanding of its intended use.",
          "Changes in design and materials keep opening new discussions. Editorial articles connect product perspectives with the stages of making.",
        ],
        [
          "The next conversation",
          "A company story can also help explain the present and prepare for the next step. Clear information and reliable records make that story consistent.",
          "Use the contact form if you need a company introduction for a specific enquiry.",
        ],
      ],
    ],
    { routeKey: "lich-su" },
  ),
  entry(
    "pages",
    "tam-nhin-su-menh",
    [
      "Cùng tạo nên giá trị lâu dài",
      "Một định hướng biên tập về chất lượng, con người và hợp tác trong lĩnh vực may mặc.",
      [
        [
          "Chất lượng trong cách trao đổi",
          "Một cuộc trao đổi về chất lượng cần đi từ nhu cầu sử dụng đến thông số có thể kiểm tra. Mẫu đối chiếu, dung sai và cách đánh giá giúp các bên hiểu cùng một yêu cầu.",
          "Website tập trung cung cấp thông tin có cấu trúc để người đọc dễ bắt đầu cuộc trao đổi này.",
        ],
        [
          "Con người và chuyên môn",
          "May mặc kết nối thiết kế, kỹ thuật và nhiều công đoạn thực hiện. Hiểu vai trò của từng công đoạn giúp những quyết định về sản phẩm có cơ sở hơn.",
          "Góc nhìn về con người trên website đề cao học hỏi, trao đổi rõ ràng và sự cẩn trọng trong công việc.",
        ],
        [
          "Hợp tác từ sự rõ ràng",
          "Nhu cầu sản phẩm, thời gian và phạm vi công việc cần được làm rõ trước khi thống nhất một hướng đi. Các câu hỏi đúng giúp giảm hiểu nhầm giữa các bên.",
          "Chia sẻ yêu cầu cụ thể qua trang liên hệ để mở đầu cuộc trao đổi.",
        ],
      ],
    ],
    [
      "Creating lasting value together",
      "An editorial direction centred on quality, people and collaboration in garments.",
      [
        [
          "Quality through clear communication",
          "A quality conversation connects intended use with measurable specifications. Reference samples, tolerances and evaluation methods help everyone understand the same requirement.",
          "This website presents structured information to make that conversation easier to begin.",
        ],
        [
          "People and expertise",
          "Garments connect design, technical decisions and several stages of making. Understanding each stage helps product decisions become more informed.",
          "Our perspectives on people value learning, clear communication and careful work.",
        ],
        [
          "Collaboration through clarity",
          "Product requirements, timing and scope need to be clarified before a direction is agreed. Good questions reduce misunderstandings.",
          "Share your specific requirements through the contact form to start a discussion.",
        ],
      ],
    ],
    { routeKey: "tam-nhin-su-menh" },
  ),
  entry(
    "pages",
    "nang-luc-san-xuat",
    [
      "Từ chất liệu đến thành phẩm",
      "Sáu công đoạn để hiểu một quy trình may mặc và chuẩn bị yêu cầu sản phẩm.",
      [
        [
          "Nguyên liệu",
          "Chất liệu được xem xét theo mục đích sử dụng, cấu trúc và cảm giác bề mặt. Thành phần, định lượng và yêu cầu bảo quản là những thông tin nên có trong hồ sơ sản phẩm.",
          "Mẫu vật liệu giúp đối chiếu màu sắc và cảm giác trước khi quyết định các chi tiết tiếp theo.",
        ],
        [
          "Cắt",
          "Rập và sơ đồ cắt chuyển thiết kế thành các chi tiết có thể lắp ráp. Kích thước, chiều vải và vị trí các chi tiết cần được xem xét cùng nhau.",
          "Việc làm rõ thông số từ đầu giúp quá trình đối chiếu mẫu được nhất quán.",
        ],
        [
          "May",
          "Các chi tiết được kết nối theo cấu trúc của sản phẩm. Loại đường may, mật độ mũi và cách xử lý mép phụ thuộc vào thiết kế và chất liệu.",
          "Những vị trí chịu lực hoặc cần độ linh hoạt nên được trao đổi cụ thể trong hồ sơ kỹ thuật.",
        ],
        [
          "Hoàn thiện",
          "Hoàn thiện bao gồm những thao tác giúp sản phẩm đạt hình thức mong muốn. Các yêu cầu về bề mặt, phụ liệu và cách trình bày cần được mô tả rõ.",
          "Mẫu đối chiếu giúp thống nhất cách đánh giá ở công đoạn này.",
        ],
        [
          "Kiểm tra chất lượng",
          "Sản phẩm được đối chiếu với các yêu cầu đã thống nhất. Kích thước, đường may, phụ liệu và ngoại quan là những nhóm thông tin có thể kiểm tra.",
          "Tiêu chí và cách ghi nhận kết quả nên được xác định theo từng yêu cầu sản phẩm.",
        ],
        [
          "Giao hàng",
          "Đóng gói và ghi nhãn cần phù hợp với phương án đã trao đổi. Số lượng, quy cách và các thông tin đi kèm giúp bàn giao rõ ràng.",
          "Thời gian và điều kiện giao nhận cần được xác nhận trong từng cuộc trao đổi; trang này không thay thế cam kết thương mại.",
        ],
      ],
    ],
    [
      "From materials to finished garments",
      "Six stages for understanding a garment workflow and preparing product requirements.",
      [
        [
          "Materials",
          "Materials are considered against intended use, construction and surface feel. Composition, weight and care requirements are useful parts of a product brief.",
          "Material samples help align colour and feel before further details are decided.",
        ],
        [
          "Cutting",
          "Patterns and cutting layouts translate a design into components for assembly. Measurements, fabric direction and component placement need to be considered together.",
          "Clear specifications support consistent sample comparison.",
        ],
        [
          "Sewing",
          "Components are joined according to the garment construction. Seam type, stitch density and edge treatment depend on design and material.",
          "Areas that need strength or flexibility should be discussed in the technical brief.",
        ],
        [
          "Finishing",
          "Finishing brings the garment towards its intended appearance. Surface treatment, trims and presentation requirements need clear descriptions.",
          "A reference sample helps align evaluation at this stage.",
        ],
        [
          "Quality checks",
          "Garments can be compared against agreed requirements. Measurements, seams, trims and appearance are useful groups of checks.",
          "Criteria and recording methods should be defined for each product requirement.",
        ],
        [
          "Delivery",
          "Packaging and labelling should follow the agreed plan. Quantity, packing specifications and accompanying information support a clear handover.",
          "Timing and delivery conditions need confirmation for each enquiry; this overview is not a commercial commitment.",
        ],
      ],
    ],
    { routeKey: "nang-luc-san-xuat" },
    "sewing",
  ),
  entry(
    "pages",
    "phat-trien-ben-vung",
    [
      "Trách nhiệm từ những điều cụ thể",
      "Góc nhìn về con người, quy trình và sử dụng nguồn lực trong ngành may mặc.",
      [
        [
          "Con người",
          "Trách nhiệm trong công việc bắt đầu từ cách tổ chức thông tin và trao đổi yêu cầu. Hướng dẫn rõ ràng và phản hồi có cơ sở giúp mỗi người hiểu vai trò của mình.",
          "Các chính sách cụ thể về lao động cần được xem trong hồ sơ doanh nghiệp có thẩm quyền.",
        ],
        [
          "Quy trình",
          "Một quy trình dễ theo dõi giúp phát hiện những điểm cần cải thiện. Ghi nhận kết quả và đối chiếu mẫu tạo cơ sở cho các cuộc trao đổi kỹ thuật.",
          "Trang này giới thiệu cách nhìn về quy trình; không thay thế đánh giá độc lập hay chứng nhận.",
        ],
        [
          "Nguồn lực",
          "Lựa chọn vật liệu, bố trí cắt và bảo quản sản phẩm đều liên quan đến sử dụng nguồn lực. Những quyết định này cần xét trong bối cảnh thiết kế và yêu cầu sử dụng.",
          "Các mục tiêu hay số liệu môi trường chỉ nên công bố khi có phương pháp đo và hồ sơ kiểm chứng.",
        ],
        [
          "Giá trị lâu dài",
          "Một sản phẩm được mô tả đúng mục đích sử dụng giúp người mua hiểu cách lựa chọn và bảo quản. Thông tin rõ ràng là một phần của trách nhiệm với sản phẩm.",
          "Hãy chia sẻ các yêu cầu về vật liệu, đánh giá và hồ sơ cần thiết khi bắt đầu cuộc trao đổi.",
        ],
      ],
    ],
    [
      "Responsibility in practical details",
      "Perspectives on people, processes and resources in garment manufacturing.",
      [
        [
          "People",
          "Responsible work starts with organised information and clear communication. Useful instructions and grounded feedback help everyone understand their role.",
          "Specific labour policies should be reviewed in authorised company records.",
        ],
        [
          "Processes",
          "A traceable workflow makes improvement opportunities easier to discuss. Recorded results and reference samples support technical conversations.",
          "This page offers process perspectives and does not substitute for independent assessment or certification.",
        ],
        [
          "Resources",
          "Material choices, cutting layouts and garment care relate to resource use. These decisions need to be considered alongside design and intended use.",
          "Environmental targets or metrics should only be published with measurement methods and supporting records.",
        ],
        [
          "Long-term value",
          "A garment described around its intended use helps buyers choose and care for it. Clear information is part of product responsibility.",
          "Share material requirements, assessment needs and required documentation when starting a discussion.",
        ],
      ],
    ],
    { routeKey: "phat-trien-ben-vung" },
  ),
  entry(
    "pages",
    "tuyen-dung",
    [
      "Cùng tìm hiểu cơ hội nghề nghiệp",
      "Khám phá các nhóm chuyên môn trong ngành may và cách gửi yêu cầu tìm hiểu cơ hội.",
      [
        [
          "Những nhóm chuyên môn",
          "Ngành may kết nối thiết kế, kỹ thuật, thực hiện sản phẩm và tổ chức công việc. Mỗi nhóm có những kỹ năng và câu hỏi chuyên môn riêng.",
          "Hiểu nhóm công việc mình quan tâm là bước đầu để chuẩn bị một cuộc trao đổi có ý nghĩa.",
        ],
        [
          "Chuẩn bị thông tin",
          "Bạn có thể giới thiệu ngắn gọn kinh nghiệm, kỹ năng và nhóm công việc quan tâm. Hãy gửi thông tin cần thiết cho yêu cầu ban đầu và tránh cung cấp giấy tờ cá nhân nhạy cảm qua biểu mẫu.",
          "Chỉ gửi hồ sơ chi tiết khi đã xác nhận đầu mối tiếp nhận và yêu cầu cụ thể.",
        ],
        [
          "Trao đổi về cơ hội",
          "Trang này chưa công bố vị trí tuyển dụng đang mở. Để tìm hiểu thông tin phù hợp, gửi yêu cầu qua trang liên hệ với tiêu đề về nghề nghiệp.",
          "Điều kiện, quy trình và lịch tuyển dụng cần được xác nhận qua thông báo chính thức.",
        ],
      ],
    ],
    [
      "Explore career opportunities",
      "Learn about garment expertise and how to enquire about opportunities.",
      [
        [
          "Areas of expertise",
          "Garment work connects design, technical decisions, making and organisation. Each area has its own skills and professional questions.",
          "Understanding the work that interests you is a useful first step for a meaningful discussion.",
        ],
        [
          "Prepare your information",
          "Briefly describe your experience, skills and area of interest. Share only what is needed for an initial enquiry and avoid sensitive personal documents in the contact form.",
          "Send detailed records only after confirming the receiving contact and requirements.",
        ],
        [
          "Enquire about opportunities",
          "This page does not announce any currently open vacancies. Use the contact form with a career-related subject to enquire.",
          "Conditions, procedures and recruitment dates need confirmation in an official notice.",
        ],
      ],
    ],
    { routeKey: "tuyen-dung" },
  ),
  entry(
    "pages",
    "chinh-sach-bao-mat",
    [
      "Thông tin về quyền riêng tư",
      "Cách website xử lý thông tin tài khoản và các yêu cầu gửi qua biểu mẫu.",
      [
        [
          "Thông tin bạn cung cấp",
          "Biểu mẫu liên hệ tiếp nhận tên, địa chỉ email, chủ đề và nội dung yêu cầu. Khi tạo tài khoản, bạn cung cấp email, tên và mật khẩu; mật khẩu được lưu dưới dạng băm.",
          "Không gửi thông tin nhạy cảm hoặc giấy tờ cá nhân không cần thiết qua biểu mẫu.",
        ],
        [
          "Mục đích xử lý",
          "Thông tin liên hệ được dùng để xem xét và phản hồi yêu cầu. Thông tin tài khoản phục vụ đăng nhập, xác minh email, khôi phục mật khẩu và bảo vệ quyền truy cập.",
          "Trang không thu thập thông tin thanh toán trong luồng liên hệ hoặc đăng ký hiện tại.",
        ],
        [
          "Phiên đăng nhập và quyền truy cập",
          "Website sử dụng cookie phiên làm mới có thuộc tính HttpOnly và token truy cập trong bộ nhớ ứng dụng. Cookie này phục vụ đăng nhập, không phải một công cụ quảng cáo.",
          "Các chức năng quản trị giới hạn theo quyền tài khoản. Tài khoản quản trị cần xác thực hai bước trước khi truy cập CMS.",
        ],
        [
          "Yêu cầu về thông tin cá nhân",
          "Sử dụng trang liên hệ để gửi yêu cầu liên quan đến dữ liệu của bạn. Mô tả yêu cầu và thông tin đủ để xác định tài khoản; không gửi mật khẩu hay mã xác thực.",
          "Thời hạn lưu trữ và đầu mối pháp lý cần được doanh nghiệp phê duyệt trước khi website chính thức vận hành.",
        ],
      ],
    ],
    [
      "Privacy information",
      "How this website handles account information and contact enquiries.",
      [
        [
          "Information you provide",
          "The contact form receives your name, email, subject and message. Account registration collects an email, name and password; passwords are stored as hashes.",
          "Do not send unnecessary sensitive information or personal documents through the form.",
        ],
        [
          "Purpose of processing",
          "Contact information supports reviewing and responding to enquiries. Account information supports sign-in, email verification, password recovery and access protection.",
          "The current contact and registration flows do not collect payment information.",
        ],
        [
          "Sessions and access",
          "The website uses an HttpOnly refresh-session cookie and an access token held in application memory. This cookie supports sign-in and is not an advertising tool.",
          "Administrative functions are restricted by account permissions. Administrative accounts require two-factor authentication to access the CMS.",
        ],
        [
          "Personal information requests",
          "Use the contact page for requests about your data. Describe your request and provide enough information to identify the account; do not send passwords or verification codes.",
          "Retention periods and the legal contact require company approval before the website launches.",
        ],
      ],
    ],
    { routeKey: "chinh-sach-bao-mat" },
    null,
  ),
];
const products = [
  [
    "ao-khoac",
    "Áo khoác & outerwear",
    "Outerwear",
    "Cấu trúc, lớp vật liệu và những chi tiết phục vụ mục đích sử dụng.",
    "Construction, material layers and details for the intended use.",
  ],
  [
    "trang-phuc-the-thao",
    "Trang phục thể thao",
    "Sportswear",
    "Góc nhìn về độ thoải mái, sự linh hoạt và lựa chọn chất liệu.",
    "Perspectives on comfort, flexibility and material choices.",
  ],
  [
    "quan-thoi-trang",
    "Quần & trang phục thời trang",
    "Trousers & fashion",
    "Phom dáng, thông số và sự nhất quán giữa thiết kế với thành phẩm.",
    "Fit, specifications and consistency between design and finished garments.",
  ],
];
for (const [key, vi, en, excerptVi, excerptEn] of products)
  previewCatalog.push(
    entry(
      "products",
      key,
      [
        vi,
        excerptVi,
        [
          [
            "Thiết kế theo mục đích sử dụng",
            "Mỗi nhóm sản phẩm bắt đầu từ nhu cầu sử dụng và một thiết kế có thể đối chiếu. Chất liệu, phom dáng và chi tiết cần được trao đổi cùng nhau.",
            "Danh mục này giới thiệu nhóm sản phẩm, không thay thế một hồ sơ thông số hoặc mẫu đã được xác nhận.",
          ],
          [
            "Thông tin để bắt đầu trao đổi",
            "Hãy chuẩn bị hình ảnh tham khảo, bảng kích thước, yêu cầu về vật liệu và thời gian dự kiến. Các yêu cầu kiểm tra hoặc hồ sơ đi kèm cũng nên được làm rõ từ đầu.",
            "Gửi yêu cầu qua trang liên hệ để tiếp tục trao đổi về sản phẩm.",
          ],
        ],
      ],
      [
        en,
        excerptEn,
        [
          [
            "Design around intended use",
            "Each product family starts with a use case and a reference design. Materials, fit and details should be considered together.",
            "This showcase introduces product families rather than an approved technical specification or sample.",
          ],
          [
            "Information for an enquiry",
            "Prepare reference images, measurements, material requirements and intended timing. Clarify any assessment or documentation requirements at the start.",
            "Use the contact page to continue a product discussion.",
          ],
        ],
      ],
      { specification: "" },
      key === "ao-khoac"
        ? "jacket"
        : key === "trang-phuc-the-thao"
          ? "sportswear"
          : "trousers",
    ),
  );
for (const [
  resource,
  key,
  vi,
  en,
  descVi,
  descEn,
  bodyVi,
  bodyEn,
  metadata,
] of [
  [
    "branches",
    "ket-noi-san-xuat",
    "Kết nối nhu cầu sản xuất",
    "Connecting manufacturing enquiries",
    "Một đầu mối để bắt đầu trao đổi về sản phẩm và hồ sơ cần thiết.",
    "A starting point for product and documentation enquiries.",
    "Chia sẻ nhu cầu về nhóm sản phẩm, thông số và các câu hỏi kỹ thuật. Địa điểm, đầu mối tiếp nhận và điều kiện làm việc cụ thể cần được xác nhận trong cuộc trao đổi.",
    "Share your product family, specifications and technical questions. Specific locations, receiving contacts and working arrangements need confirmation in the discussion.",
    { type: "", address: "", phone: "", email: "", hours: "" },
  ],
  [
    "partners",
    "hop-tac-may-mac",
    "Hợp tác từ sự rõ ràng",
    "Collaboration through clarity",
    "Từ yêu cầu ban đầu đến một cuộc trao đổi có chiều sâu.",
    "From an initial brief to an informed discussion.",
    "Thông tin về sản phẩm, phạm vi công việc và thời gian là cơ sở cho cuộc trao đổi hợp tác. Danh sách thương hiệu đối tác chỉ được công bố khi có quyền sử dụng tên và hồ sơ xác nhận.",
    "Product information, scope and timing form a basis for collaboration. Partner brands should only be published with naming permission and supporting records.",
    { website: "" },
  ],
  [
    "certifications",
    "ho-so-chat-luong",
    "Góc nhìn về chất lượng",
    "A quality perspective",
    "Thông số, mẫu đối chiếu và tiêu chí kiểm tra.",
    "Specifications, reference samples and evaluation criteria.",
    "Chất lượng cần được trao đổi bằng các yêu cầu cụ thể và bằng chứng có thể đối chiếu. Khi cần chứng nhận hoặc báo cáo đánh giá, hãy nêu rõ phạm vi và thời điểm hiệu lực trong yêu cầu; trang này không tuyên bố một chứng nhận hiện hành.",
    "Quality needs specific requirements and evidence that can be compared. If you require certification or assessment reports, clarify scope and validity in your enquiry; this page does not claim any current certification.",
    { issuer: "", validUntil: "" },
  ],
])
  previewCatalog.push(
    entry(
      resource,
      key,
      [
        vi,
        descVi,
        [
          [
            "Bắt đầu cuộc trao đổi",
            bodyVi,
            "Gửi yêu cầu qua trang liên hệ để làm rõ thông tin phù hợp với nhu cầu của bạn.",
          ],
        ],
      ],
      [
        en,
        descEn,
        [
          [
            "Start the discussion",
            bodyEn,
            "Use the contact form to clarify the information relevant to your requirements.",
          ],
        ],
      ],
      metadata,
    ),
  );
export const categories = [
  ["goc-nhin-nganh-may", "Góc nhìn ngành may", "Garment perspectives"],
  ["san-pham-chat-lieu", "Sản phẩm & chất liệu", "Products & materials"],
  ["con-nguoi-hop-tac", "Con người & hợp tác", "People & collaboration"],
];
const articles = [
  [
    "tu-chat-lieu-den-thanh-pham",
    "Từ chất liệu đến thành phẩm",
    "From materials to finished garments",
    "Hiểu các công đoạn giúp đặt câu hỏi tốt hơn về một sản phẩm may mặc.",
    "Understanding the stages helps you ask better garment questions.",
    "goc-nhin-nganh-may",
    [
      [
        "Một sản phẩm, nhiều quyết định",
        "Một sản phẩm may mặc bắt đầu từ mục đích sử dụng. Chất liệu, phom dáng và cấu trúc cần cùng phục vụ mục đích đó; một quyết định riêng lẻ khó thay thế cho việc xem xét toàn bộ sản phẩm.",
        "Hình ảnh tham khảo và mẫu vật liệu là những điểm khởi đầu hữu ích. Chúng giúp cuộc trao đổi đi từ ý tưởng sang những chi tiết có thể đối chiếu.",
      ],
      [
        "Kết nối các công đoạn",
        "Rập, cắt, may và hoàn thiện có liên hệ với nhau. Thông số rõ ràng ở đầu quy trình giúp người thực hiện hiểu các chi tiết cần chú ý ở bước tiếp theo.",
        "Một mẫu đối chiếu cũng tạo ngôn ngữ chung để trao đổi về kích thước, đường may và ngoại quan.",
      ],
      [
        "Chuẩn bị yêu cầu",
        "Hãy mô tả nhóm sản phẩm, điều kiện sử dụng và các yêu cầu kỹ thuật quan trọng. Thời gian dự kiến và hồ sơ cần đi kèm cũng nên được đưa vào cuộc trao đổi ban đầu.",
        "Những thông tin này giúp xác định câu hỏi tiếp theo; chúng không thay thế việc xác nhận mẫu hoặc thỏa thuận cụ thể.",
      ],
    ],
    [
      [
        "One garment, many decisions",
        "A garment starts with intended use. Materials, fit and construction need to serve that use together; an isolated choice cannot replace considering the whole product.",
        "Reference images and material samples are useful starting points. They move a discussion from an idea to details that can be compared.",
      ],
      [
        "Connecting the stages",
        "Patterns, cutting, sewing and finishing are connected. Clear specifications at the start help makers understand what matters in the next stage.",
        "A reference sample also creates a shared language for measurements, seams and appearance.",
      ],
      [
        "Preparing a brief",
        "Describe the product family, use conditions and key technical requirements. Include intended timing and required documentation in the initial conversation.",
        "This information helps identify the next questions; it does not replace sample approval or a specific agreement.",
      ],
    ],
  ],
  [
    "chi-tiet-tao-nen-chat-luong",
    "Chi tiết tạo nên chất lượng",
    "Details that shape quality",
    "Đường may, kích thước và tiêu chí đối chiếu cần được xem xét cùng nhau.",
    "Seams, measurements and comparison criteria belong together.",
    "goc-nhin-nganh-may",
    [
      [
        "Từ kỳ vọng đến tiêu chí",
        "Chất lượng là một từ rộng. Để trao đổi có hiệu quả, hãy chuyển kỳ vọng thành yêu cầu về kích thước, cấu trúc và hình thức có thể quan sát.",
        "Các dung sai và vị trí đo cần được mô tả nhất quán. Điều này giúp tránh những cách hiểu khác nhau về cùng một mẫu.",
      ],
      [
        "Những chi tiết cần chú ý",
        "Mép vải, điểm nối và phụ liệu là các vị trí đáng xem xét cùng mục đích sử dụng. Một đường may phù hợp còn phụ thuộc vào chất liệu và cấu trúc sản phẩm.",
        "Mẫu đối chiếu giúp nhận diện những chi tiết quan trọng trước khi đánh giá thành phẩm.",
      ],
      [
        "Ghi nhận rõ ràng",
        "Kết quả kiểm tra có ích khi cho biết đã đối chiếu tiêu chí nào và tại vị trí nào. Hình ảnh và ghi chú ngắn giúp cuộc trao đổi tiếp theo cụ thể hơn.",
        "Một yêu cầu về báo cáo hoặc tiêu chuẩn đánh giá nên được làm rõ ngay từ hồ sơ ban đầu.",
      ],
    ],
    [
      [
        "From expectations to criteria",
        "Quality is a broad term. For a useful discussion, translate expectations into observable measurements, construction and appearance requirements.",
        "Describe tolerances and measurement points consistently. This reduces different interpretations of the same sample.",
      ],
      [
        "Details worth considering",
        "Fabric edges, joins and trims deserve attention alongside intended use. A suitable seam also depends on material and garment construction.",
        "A reference sample helps identify important details before finished garments are evaluated.",
      ],
      [
        "Clear records",
        "An inspection result is useful when it explains which criterion and location were compared. Images and brief notes make the next conversation more specific.",
        "Clarify reporting or assessment requirements in the initial brief.",
      ],
    ],
  ],
  [
    "lua-chon-vai-cho-san-pham",
    "Lựa chọn vải theo mục đích sử dụng",
    "Choosing fabric for intended use",
    "Thành phần, định lượng và cảm giác bề mặt là những điểm bắt đầu hữu ích.",
    "Composition, weight and surface feel are useful starting points.",
    "san-pham-chat-lieu",
    [
      [
        "Bắt đầu bằng điều kiện sử dụng",
        "Một chất liệu phù hợp cần được xem trong bối cảnh sản phẩm sẽ được sử dụng như thế nào. Độ linh hoạt, bề mặt và cách bảo quản là những yếu tố có thể ảnh hưởng đến lựa chọn.",
        "Hãy nêu rõ các yêu cầu này thay vì chỉ chọn theo tên gọi của chất liệu.",
      ],
      [
        "Đối chiếu thông tin và mẫu",
        "Thành phần và định lượng cung cấp thông tin ban đầu, còn mẫu giúp cảm nhận bề mặt và màu sắc. Hai nguồn thông tin nên được xem cùng nhau.",
        "Nếu cần kết quả đánh giá đặc tính cụ thể, hãy trao đổi phương pháp và hồ sơ cần đối chiếu.",
      ],
      [
        "Liên hệ với cấu trúc sản phẩm",
        "Một vật liệu còn cần phù hợp với rập, đường may và cách hoàn thiện. Những yếu tố này có thể ảnh hưởng lẫn nhau khi chuyển từ thiết kế sang mẫu.",
        "Chuẩn bị mẫu và yêu cầu kỹ thuật rõ ràng giúp cuộc trao đổi về vật liệu có cơ sở hơn.",
      ],
    ],
    [
      [
        "Start with use conditions",
        "A suitable material needs to be considered in the context of how the garment will be used. Flexibility, surface characteristics and care can affect the choice.",
        "Describe those needs rather than choosing by a material name alone.",
      ],
      [
        "Compare information with samples",
        "Composition and weight provide initial information, while samples help assess surface feel and colour. Consider both together.",
        "If specific characteristics need assessment, discuss methods and supporting records.",
      ],
      [
        "Connect materials and construction",
        "Material should also suit the pattern, seams and finishing. These factors can influence one another as a design becomes a sample.",
        "Clear samples and technical requirements create a stronger basis for material discussions.",
      ],
    ],
  ],
  [
    "hieu-cau-truc-ao-khoac",
    "Hiểu cấu trúc của một chiếc áo khoác",
    "Understanding outerwear construction",
    "Nhìn sản phẩm qua lớp vật liệu, phom dáng và các chi tiết sử dụng.",
    "Look at garments through layers, fit and functional details.",
    "san-pham-chat-lieu",
    [
      [
        "Lớp vật liệu và phom dáng",
        "Áo khoác có thể kết hợp nhiều lớp và chi tiết khác nhau theo thiết kế. Việc lựa chọn nên đi từ mục đích sử dụng và hình thức mong muốn.",
        "Hình ảnh tham khảo chỉ là bước đầu; cấu trúc cần được mô tả bằng các chi tiết có thể đối chiếu.",
      ],
      [
        "Phụ liệu và điểm nối",
        "Khóa, túi và các vị trí kết nối ảnh hưởng đến cách dùng sản phẩm. Kích thước và cách bố trí cần được xem cùng phom dáng.",
        "Một mẫu đối chiếu giúp làm rõ các chi tiết trước khi thống nhất hồ sơ kỹ thuật.",
      ],
      [
        "Chuẩn bị bản mô tả",
        "Nêu rõ nhóm người sử dụng, bảng kích thước và yêu cầu về lớp vật liệu. Các yêu cầu đánh giá riêng cần được xác nhận cùng phạm vi hồ sơ.",
        "Danh mục sản phẩm là điểm bắt đầu cho cuộc trao đổi, không thay thế thông số đã thống nhất.",
      ],
    ],
    [
      [
        "Layers and fit",
        "Outerwear can combine different layers and details depending on the design. Choices should follow intended use and the desired appearance.",
        "Reference images are a first step; construction needs details that can be compared.",
      ],
      [
        "Trims and joins",
        "Fastenings, pockets and joins affect how a garment is used. Size and placement need to be considered alongside fit.",
        "A reference sample helps clarify details before technical specifications are agreed.",
      ],
      [
        "Prepare a description",
        "Specify intended users, measurements and material-layer requirements. Any specialised assessment needs confirmation alongside the documentation scope.",
        "A product showcase starts the conversation and does not replace agreed specifications.",
      ],
    ],
  ],
  [
    "con-nguoi-trong-quy-trinh-may",
    "Con người trong quy trình may mặc",
    "People in the garment workflow",
    "Trao đổi rõ ràng giúp kết nối các vai trò và công đoạn.",
    "Clear communication connects roles and stages.",
    "con-nguoi-hop-tac",
    [
      [
        "Một ngôn ngữ chung",
        "Thiết kế và kỹ thuật đôi khi mô tả cùng một chi tiết bằng những cách khác nhau. Mẫu, hình ảnh và thuật ngữ rõ ràng giúp tạo một ngôn ngữ chung.",
        "Cuộc trao đổi nên xác định điều gì đã thống nhất và câu hỏi nào cần làm rõ tiếp.",
      ],
      [
        "Học hỏi từ phản hồi",
        "Phản hồi có ích khi chỉ ra vị trí, tiêu chí và bối cảnh cụ thể. Một ghi chú ngắn cùng hình ảnh thường giúp người nhận hiểu nhanh hơn.",
        "Thông tin được tổ chức rõ ràng giúp các vai trò theo dõi yêu cầu nhất quán.",
      ],
      [
        "Tôn trọng công việc của nhau",
        "Mỗi công đoạn có những giới hạn và câu hỏi riêng. Trao đổi sớm về những điểm này giúp kế hoạch có cơ sở hơn.",
        "Chuyên môn được kết nối tốt khi yêu cầu và phản hồi được diễn đạt rõ ràng.",
      ],
    ],
    [
      [
        "A shared language",
        "Design and technical teams may describe the same detail differently. Samples, images and clear terminology help create a shared language.",
        "A discussion should identify what is agreed and which questions still need clarification.",
      ],
      [
        "Learning from feedback",
        "Useful feedback identifies a location, criterion and context. A brief note with an image often helps the receiver understand faster.",
        "Well-organised information helps different roles follow requirements consistently.",
      ],
      [
        "Respecting each stage",
        "Every stage has its own constraints and questions. Discussing them early makes a plan better informed.",
        "Expertise connects well when requirements and feedback are clear.",
      ],
    ],
  ],
  [
    "chuan-bi-yeu-cau-hop-tac",
    "Chuẩn bị một yêu cầu hợp tác",
    "Preparing a collaboration enquiry",
    "Những thông tin giúp cuộc trao đổi đầu tiên đi đúng trọng tâm.",
    "Information that gives the first conversation a useful focus.",
    "con-nguoi-hop-tac",
    [
      [
        "Mô tả nhu cầu",
        "Bắt đầu bằng nhóm sản phẩm, mục đích sử dụng và thiết kế tham khảo. Nêu rõ điều gì là yêu cầu bắt buộc và điều gì còn có thể trao đổi.",
        "Một yêu cầu ngắn nhưng có cấu trúc thường dễ tiếp nhận hơn nhiều thông tin chưa được sắp xếp.",
      ],
      [
        "Thời gian và phạm vi",
        "Thời gian dự kiến giúp định hình cuộc trao đổi, nhưng cần được xác nhận theo điều kiện cụ thể. Hồ sơ kỹ thuật và yêu cầu đánh giá cũng là một phần của phạm vi.",
        "Tránh hiểu thông tin giới thiệu trên website như một cam kết về giá, năng lực hoặc thời gian giao hàng.",
      ],
      [
        "Bước tiếp theo",
        "Trang liên hệ giúp gửi yêu cầu ban đầu đến bộ phận quản trị website. Chỉ cung cấp thông tin cần thiết và không gửi mật khẩu, mã xác thực hay giấy tờ nhạy cảm.",
        "Các chi tiết sản phẩm và điều kiện hợp tác cần được thống nhất qua cuộc trao đổi tiếp theo.",
      ],
    ],
    [
      [
        "Describe the need",
        "Start with the product family, intended use and reference design. Distinguish essential requirements from details that remain open for discussion.",
        "A concise, structured enquiry is often easier to understand than unorganised information.",
      ],
      [
        "Timing and scope",
        "Intended timing helps shape the discussion but needs confirmation for the specific conditions. Technical documentation and assessment requirements are part of the scope.",
        "Do not read website introductions as commitments about price, capacity or delivery dates.",
      ],
      [
        "The next step",
        "The contact page sends an initial enquiry to website administrators. Provide necessary information only and avoid passwords, verification codes or sensitive documents.",
        "Product details and collaboration conditions need agreement in the next conversation.",
      ],
    ],
  ],
];
for (const [
  key,
  vi,
  en,
  excerptVi,
  excerptEn,
  category,
  bodyVi,
  bodyEn,
] of articles)
  previewCatalog.push(
    entry(
      "posts",
      key,
      [vi, excerptVi, bodyVi],
      [en, excerptEn, bodyEn],
      {},
      key === "hieu-cau-truc-ao-khoac"
        ? "jacket"
        : [
              "tu-chat-lieu-den-thanh-pham",
              "con-nguoi-trong-quy-trinh-may",
            ].includes(key)
          ? "sewing"
          : "textile",
      category,
    ),
  );
const heroUrls = [
  "https://images.pexels.com/photos/5830692/pexels-photo-5830692.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/12362544/pexels-photo-12362544.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
];
for (const [n, vi, en, descVi, descEn, link] of [
  [
    0,
    "Từ từng đường kim,\nđến giá trị.",
    "Thoughtfully made.\nPrecisely sewn.",
    "HUGAMEX — Công ty Cổ phần May Hữu Nghị. Khám phá câu chuyện và sản phẩm may mặc.",
    "HUGAMEX — Huu Nghi Garment. Explore garment products and perspectives.",
    "/gioi-thieu",
  ],
  [
    1,
    "Chất liệu mở đầu.\nChi tiết tiếp nối.",
    "It starts with materials.\nDetails follow.",
    "Từ cấu trúc vải đến những công đoạn tạo nên một sản phẩm.",
    "From fabric construction to the stages that shape a garment.",
    "/nang-luc-san-xuat",
  ],
  [
    2,
    "Kết nối ý tưởng,\nmở đầu hợp tác.",
    "Connect ideas.\nStart a conversation.",
    "Chia sẻ nhu cầu sản phẩm để cùng tìm hiểu những bước tiếp theo.",
    "Share product requirements and explore the next steps.",
    "/lien-he",
  ],
])
  previewCatalog.push(
    entry(
      "hero-slides",
      `hero-preview-${n + 1}`,
      [vi, descVi, []],
      [en, descEn, []],
      { link, externalImageUrl: heroUrls[n] },
      null,
    ),
  );
const previewHomeCopy = {
  about: [
    "May mặc là chuyên môn.\nCon người là nền tảng.",
    "Made with expertise.\nBuilt around people.",
    "Khám phá sản phẩm, chất liệu và câu chuyện của HUGAMEX.",
    "Explore HUGAMEX products, materials and perspectives.",
  ],
  manufacturing: [
    "Một quy trình.\nTừng chi tiết.",
    "One process.\nEvery detail.",
    "Từ vật liệu đến giao hàng: sáu công đoạn để bắt đầu tìm hiểu nghề may.",
    "From materials to delivery: six stages to begin exploring garment making.",
  ],
  products: [
    "Chuyên môn trong\ntừng sản phẩm.",
    "Expertise in\nevery garment.",
    "Áo khoác, trang phục thể thao và quần — những nhóm sản phẩm để bắt đầu cuộc trao đổi.",
    "Outerwear, sportswear and trousers — product families to start a discussion.",
  ],
  branches: [
    "Kết nối nhu cầu.\nMở đầu cơ hội.",
    "Connect requirements.\nExplore opportunities.",
    "Chia sẻ nhu cầu về sản phẩm, hồ sơ kỹ thuật và thông tin cần làm rõ.",
    "Share product requirements, technical documents and questions.",
  ],
  quality: [
    "Chất lượng từ\nsự rõ ràng.",
    "Quality through\nclarity.",
    "Thông số, mẫu đối chiếu và tiêu chí kiểm tra giúp cuộc trao đổi có cơ sở.",
    "Specifications, reference samples and evaluation criteria inform the discussion.",
  ],
  partners: [
    "Cùng xây dựng\ngiá trị lâu dài.",
    "Creating lasting\nvalue together.",
    "Một cuộc trao đổi rõ ràng là khởi đầu cho hợp tác.",
    "Clear communication starts collaboration.",
  ],
  news: [
    "Tin tức &\ngóc nhìn nghề may.",
    "Journal &\ngarment perspectives.",
    "Những bài viết để hiểu thêm về chất liệu, sản phẩm và hợp tác.",
    "Editorial perspectives on materials, products and collaboration.",
  ],
};

import {
  companyProfile,
  profileHomeCopy,
  retiredKeys,
} from "./company-profile.mjs";
export { companySettings, retiredKeys } from "./company-profile.mjs";
const replacements = companyProfile(entry);
const replacedKeys = new Set(
  replacements.map((item) => `${item.resource}/${item.key}`),
);
export const catalog = [
  ...previewCatalog.filter(
    (item) =>
      !replacedKeys.has(`${item.resource}/${item.key}`) &&
      !retiredKeys.includes(`${item.resource}/${item.key}`),
  ),
  ...replacements,
];
export const homeCopy = { ...previewHomeCopy, ...profileHomeCopy };
