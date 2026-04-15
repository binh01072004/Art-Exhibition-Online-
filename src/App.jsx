import { Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, Sky, useTexture, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// 1. HỆ THỐNG DI CHUYỂN: Lắng nghe bàn phím
function usePlayerControls() {
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setMovement((m) => ({ ...m, forward: true }))
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setMovement((m) => ({ ...m, backward: true }))
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setMovement((m) => ({ ...m, left: true }))
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setMovement((m) => ({ ...m, right: true }))
    }
    const handleKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setMovement((m) => ({ ...m, forward: false }))
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setMovement((m) => ({ ...m, backward: false }))
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setMovement((m) => ({ ...m, left: false }))
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setMovement((m) => ({ ...m, right: false }))
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  return movement
}

// 2. HỆ THỐNG DI CHUYỂN: Thực thi việc bước đi
function Player() {
  const { forward, backward, left, right } = usePlayerControls()
  const direction = new THREE.Vector3()
  const frontVector = new THREE.Vector3()
  const sideVector = new THREE.Vector3()
  const speed = 15 // Tốc độ đi bộ (mét/giây)

  useFrame((state, delta) => {
    // Tính toán hướng đi dựa trên phím bấm
    frontVector.set(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    sideVector.set((left ? 1 : 0) - (right ? 1 : 0), 0, 0)
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed * delta)

    // Cập nhật vị trí camera
    state.camera.translateX(direction.x)
    state.camera.translateZ(direction.z)
    // CHẶN TƯỜNG: Giới hạn X trong khoảng -3.5 đến 3.5 để không đâm vào tranh
    if (state.camera.position.x > 4.5) state.camera.position.x = 4.5
    if (state.camera.position.x < -4.5) state.camera.position.x = -4.5
  
    // CHẶN ĐẦU/CUỐI: Không cho đi quá xa hành lang
    if (state.camera.position.z > -1) state.camera.position.z = -1
    if (state.camera.position.z < -255) state.camera.position.z = -255
    state.camera.position.y = 1.6 // Giữ chiều cao mắt người ổn định không bị bay lên trời
  })

  return <PointerLockControls />
}

// 3. Khung Tranh (Đã gộp: Đèn của bạn + Giữ tỉ lệ ảnh gốc + Tiêu đề tự rớt dòng)
function Picture({ url, position, rotation, title }) {
  const texture = useTexture(url)
  
  // 1. Tính toán kích thước để ảnh KHÔNG bị méo
  const imageWidth = texture.image.width
  const imageHeight = texture.image.height
  const aspectRatio = imageWidth / imageHeight

  // Cố định chiều cao (2.25), chiều ngang tự động nở ra hoặc co lại theo tỉ lệ gốc
  const displayHeight = 2.25
  const displayWidth = displayHeight * aspectRatio

  return (
    <group position={position} rotation={rotation}>
      {/* Đèn rọi riêng (Giữ nguyên các thông số bạn đã tinh chỉnh) */}
      <pointLight 
        position={[0, 2.5, 1.5]} 
        intensity={2}            
        distance={3}             
        decay={2}                
        color="#f8f885"        
      />

      {/* Khung tranh */}
      <mesh>
        {/* Thay số cứng 3 thành biến displayWidth để giữ tỉ lệ thật */}
        <planeGeometry args={[displayWidth, displayHeight]} />
        <meshStandardMaterial 
          map={texture} 
          side={THREE.DoubleSide}
          roughness={0.5} 
        />
      </mesh>

      {/* Tiêu đề thông minh: Tự động căn giữa và ngắt dòng */}
      <Text 
        position={[0, -(displayHeight / 2 + 0.15), 0]} // Nhích xuống một chút xíu
        fontSize={0.12} 
        color="white" 
        anchorX="center"
        anchorY="top"                   // Neo ở cạnh trên để chữ mọc dần xuống sàn
        maxWidth={4.0}   // Hàng rào: Chữ rộng tối đa bằng 90% bề ngang ảnh
        textAlign="center"              
        lineHeight={1.4}                // Khoảng cách giữa các dòng
      >
        {title}
      </Text>
    </group>
  )
}

// 4. Hành lang triển lãm
function ExhibitionGallery() {
  // 1. DANH SÁCH TÊN GIAI ĐOẠN 1 (16 ẢNH)
  const titles_p1 = [
    "Viên gạch, Nguyễn Ái Quốc dùng để sưởi ấm trong những ngày đông giá lạnh ở Pari, nước Pháp",         // Tên của p1_1.webp
    "Bản yêu sách Tám điểm của nhân dân Việt Nam do Nguyễn Ái Quốc và nhóm người Việt Nam yêu nước gửi Nghị viện Pháp và các đoàn đại biểu dự Hội nghị Vécxây (6/1919)",          // Tên của p1_2.webp
    "Toàn cảnh Đại hội đại biểu toàn quốc lần thứ 18 Đảng Xã hội Pháp ở thành Tua (Tours), Nguyễn Ái Quốc tham dự với tư cách là đại biểu Đông Dương, tháng 12/1920, (Nguyễn Ái Quốc ngồi đầu dãy bàn thứ hai, phía tay trái Đoàn Chủ tịch)",      // Tên của p1_3.webp
    "Đồng chí Nguyễn Ái Quốc năm 30 tuổi ở Pháp",                        // Tên của p1_4.webp
    "Trên chiếc tàu Pháp Latútsơ Tơrêvin này, năm 1911, người thanh niên yêu nước Nguyễn Tất Thành (tên lúc đó của Chủ tịch Hồ Chí Minh) rời Tổ quốc đi tìm đường cứu nước",
    "Bản yêu sách Tám điểm của nhân dân Việt Nam do Nguyễn Ái Quốc và nhóm người Việt Nam yêu nước gửi Nghị viện Pháp và các đoàn đại biểu dự Hội nghị Vécxây (6/1919)",
    "Bản án chế độ thực dân Pháp do Người viết bằng tiếng Pháp từ năm 1921, xuất bản lần đầu tiên ở Pháp năm 1925, là tiếng kèn tập hợp các dân tộc thuộc địa doàn kết đấu tranh chống chế độ thực dân",
    "Đồng chí Nguyễn Ái Quốc tại Liên Xô (năm 1923)",
    "Thẻ đảng viên Đảng Cộng sản Pháp của Nguyễn Ái Quốc với tên Hăngri Trần (Henri Tchen) năm 1922",
    "Báo Người cùng khổ (Le Paria), Cơ quan Ngôn luận của Hội Liên hiệp thuộc địa do Nguyễn Ái Quốc và một số nhà cách mạng sáng lập, phát hành trong những năm 1922-1926 (Số 24, tháng 4/1924)",
    "Ngôi nhà số 9, ngõ hẻm Com Poăng (Pari), nơi Người trọ từ năm 1920 đến năm 1923, là nơi Người hoạt động cách mạng và sáng tác nhiều tác phẩm quan trọng",
    "'Đường Kách mệnh' là cuốn sách lý luận do Người soạn để đào tạo cán bộ cho phong trào Cách mạng Việt Nam, xuất bản lần đầu tiên ở Quảng Châu (Trung Quốc) năm 1927, là tài liệu quan trọng để thành lập Đảng Cộng sản Việt Nam",
    "Nguyễn Ái Quốc phát biểu tại Đại hội đại biểu toàn quốc lần thứ 18 Đảng Xã hội Pháp, ủng hộ Luận cương của Lê-nin về vấn đề dân tộc và thuộc địa. Người tham gia sáng lập Đảng Cộng sản Pháp và trở thành người cộng sản Việt Nam đầu tiên (12/1920)",
    "Đồng chí Nguyễn Ái Quốc tại diễn đàn của Đại hội Quốc tế Cộng sản lần thứ 5 họp năm 1924 ở Mátxcơva, với tư cách là đại biểu của Bộ thuộc địa Đảng Cộng sản Pháp",
    "Đồng chí Nguyễn Ái Quốc với một số đại biểu dự Đại hội Quốc tế Cộng sản lần thứ 5",
    "Báo 'Người cùng khổ', cơ quan ngôn luận của vô sản thuộc địa do Người sáng lập, làm chủ bút kiêm chủ nhiệm, phát hành trong những năm 1922 đến năm 1924, từ Pari kêu gọi và tổ chức các dân tộc bị áp bức vùng lên giải phóng"
    // ... Binh phẩy và viết tiếp cho đến ảnh 16 nhé (Nhớ giữ lại dấu ngoặc kép và dấu phẩy)
  ];

  // 2. DANH SÁCH TÊN GIAI ĐOẠN 2 (40 ẢNH)
  const titles_p2 = [
    "Hội nghị thành lập Đảng 1930Bộ trang phục do gia đình luật sư Lôdơbi (Loseby) chuẩn bị cho Nguyễn Ái Quốc cải trang để rời Hồng Kông năm 1933",     // Tên của p2_1.webp
    "Pác Bó, tỉnh Cao Bằng, nơi Nguyễn Ái Quốc chọn làm địa điểm hoạt động khi về nước năm 1941",       // Tên của p2_2.webp
    "Lời kêu gọi nhân dịp thành lập Đảng Cộng sản Việt Nam (trích đoạn). Bút tích bản tiếng Anh",                        // Tên của p2_3.webp
    "Bản Nậm Quang, thôn Linh Quang, xã Thiện Bàn, huyện Tĩnh Tây, tỉnh Quảng Tây, Trung Quốc, nơi Nguyễn Ái Quốc mở lớp huấn luyện cán bộ cách mạng, cuối năm 1940, đầu năm 1941",
    "Báo Việt Nam Độc lập, Cơ quan tuyên truyền của Ban Việt Minh tỉnh Cao Bằng, do Nguyễn Ái Quốc sáng lập năm 1941 (Số 103, ngày 21/8/1941, có đăng bài và tranh vẽ của Nguyễn Ái Quốc)",
    "Bút tích của Bác Hồ trong hang Cốc Bó",
    "Bút tích của Chủ tịch Hồ Chí Minh in trên báo Việt Nam độc lập – cơ quan tuyên truyền của Ban Việt Minh tỉnh Cao Bằng, năm 1941",
    "Giường Bác Hồ nằm trong hang Cốc Bó",
    "Cột mốc 108",
    "Đình Tân Trào, huyện Sơn Dương, tỉnh Tuyên Quang, nơi diễn ra Quốc dân Đại hội do Việt Minh triệu tập tháng 8 năm 1945, quyết định Tổng khởi nghĩa, bầu ra Ủy ban dân tộc giải phóng do Hồ Chí Minh làm Chủ tịch",
    "Địa điểm Bác Hồ ngồi làm thơ (20/2/1961)",
    "Sài Gòn",
    "Ngục trung nhật ký, tập thơ chữ Hán do Hồ Chí Minh viết trong thời gian bị chính quyền Tưởng Giới Thạch bắt giam tại các nhà lao ở tỉnh Quảng Tây, Trung Quốc (từ 29/8/1942-10/9/1943)",
    "Ngục Victoria, nơi giam giữ Nguyễn Ái Quốc thời gian Người bị bắt ở Hồng Kông (1931-1933)",
    "Nguyễn Ái Quốc năm 1933",
    "Tượng Các Mác, do Nguyễn Ái Quốc tạc ở hang Cốc Bó, Cao Bằng",
    "Mít tinh quần chúng ngày 1/5/1938 tại Khu Đấu xảo Hà Nội (nay là Cung Văn hóa Lao động Hữu nghị)",
    "Bộ trang phục do gia đình luật sư Lôdơbi (Loseby) chuẩn bị cho Nguyễn Ái Quốc cải trang để rời Hồng Kông năm 1933 (2)",
    "Xô Viết – Nghệ Tĩnh, cao trào cách mạng do Đảng Cộng sản Đông Dương lãnh đạo năm 1930-1931",
    "Bác Hồ về nước (28/1/1941)",
    "Chủ tịch Hồ Chí Minh năm 1945",
    "Bàn ghế đá bên suối Lênin, nơi Nguyễn Ái Quốc làm việc trong những ngày đẹp trời. Tại đây, Người đã dịch cuốn Lịch sử Đảng Cộng sản Bônsêvích Liên Xô ra tiếng Việt và soạn thảo nhiều tài liệu khác…",
    "Bút tích trang cuối báo cáo của Nguyễn Ái Quốc gửi Quốc tế Cộng sản (18/2/1930)",
    "Thư của Nguyễn Ái Quốc gửi đồng bào cả nước được truyền đi khắp nơi trước ngày Tổng khởi nghĩa Tháng Tám (1945)",
    "Đình Tân Trào, huyện Sơn Dương, tỉnh Tuyên Quang, nơi diễn ra Quốc dân Đại hội do Việt Minh triệu tập tháng 8 năm 1945, quyết định Tổng khởi nghĩa, bầu ra Ủy ban dân tộc giải phóng do Hồ Chí Minh làm Chủ tịch",
    "Nguyễn Ái Quốc năm 1930",
    "'Thân thể ở trong lao Tinh thần ở ngoài lao Muốn nên sự nghiệp lớn Tinh thần càng phải cao'",
    "Lán Khuổi Nậm ở Pác Bó, xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng, nơi họp Hội nghị Trung ương Đảng Cộng sản Đông Dương lần thứ Tám (tháng 5/1941), quyết định đặt nhiệm vụ giải phóng dân tộc lên hàng đầu và thành lập Mặt trận Việt Minh",
    "Lán Nà Lừa, thôn Tân Lập, xã Tân Trào, huyện Sơn Dương, tỉnh Tuyên Quang, nơi Chủ tịch Hồ Chí Minh ở và làm việc trong những ngày Hội nghị toàn quốc của Đảng và Quốc dân Đại hội (1945)",
    "Hội nghị thành lập Đảng Cộng sản Việt Nam năm 1930",
    "Một đơn vị giải phóng quân làm lễ xuất phát từ cây đa Tân Trào về giải phóng Thái Nguyên (16/8/1945)",
    "Bộ trang phục do gia đình luật sư Lôdơbi (Loseby) chuẩn bị cho Nguyễn Ái Quốc cải trang để rời Hồng Kông năm 1933 (3)",
    "Hình ảnh những ngày tháng Tám lịch sử ở Hà Nội",
    "Địa điểm lán Khuổi Nặm II nơi Báo “Việt Nam độc lập” – Cơ quan ngôn luận của Mặt trận Việt Minh do đồng chí Nguyễn Ái Quốc sáng lập (01/8/1941)",
    "Suối Lênin, do Nguyễn Ái Quốc đặt tên ở Pác Bó, Cao Bằng",
    "Di tích nơi Bác Hồ ngồi câu cá",
    "Hồ Chủ tịch đã ở lán này trong những ngày Hội nghị Trung ương Đảng Cộng sản Đông Dương lần thứ 8 họp (tháng 5/1941), quyết định thành lập Việt Nam độc lập đồng minh (Mặt trận Việt Minh) lãnh đạo nhân dân cả nước thực hiện nhiệm vụ giải phóng dân tộc",
    "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn độc lập khai sinh ra nước Việt Nam dân chủ cộng hòa",
    "Bức thư của Người gửi đồng bào cả nước, ký tên là Nguyễn Ái Quốc, được truyền đi khắp nơi trước cuộc Tổng khởi nghĩa Tháng Tám thành công",
    "Thôn Lộ Mạc, ngoại thành Quế Lâm, tỉnh Quảng Tây, Trung Quốc, nơi làm việc của Văn phòng Bát lộ quân. Hồ Chí Minh với bí danh Hồ Quang, thiếu tá Bát lộ quân đã ở và làm việc tại đây (1938)"
  ];

  const pictures = []
  const gap = 4.5 
  
  // Nạp 16 ảnh Giai đoạn 1
  for (let i = 1; i <= 16; i++) {
    pictures.push({ 
      url: `/images/p1_${i}.webp`, 
      // Lấy tên ở mảng 1. Nếu bạn quên chưa gõ tên, nó sẽ hiện tạm là "Chưa đặt tên"
      title: titles_p1[i-1] || `Chưa đặt tên (P1_Ảnh ${i})`, 
      side: i % 2 === 0 ? 'right' : 'left' 
    })
  }

  // Nạp 40 ảnh Giai đoạn 2
  for (let i = 1; i <= 40; i++) {
    pictures.push({ 
      url: `/images/p2_${i}.webp`, 
      // Lấy tên ở mảng 2
      title: titles_p2[i-1] || `Chưa đặt tên (P2_Ảnh ${i})`, 
      side: (i + 16) % 2 === 0 ? 'right' : 'left' 
    })
  }

  return (
    <group>
      {pictures.map((pic, index) => {
        const zPosition = -index * gap - 5 
        // FIX Z-FIGHTING: Tranh được kéo ra cách tường 10cm (Tường -4.9, Tranh -4.8)
        const xPosition = pic.side === 'left' ? -4.8 : 4.8 
        const yRotation = pic.side === 'left' ? Math.PI / 2 : -Math.PI / 2 

        return (
          <Picture 
            key={`pic-${index}`}
            url={pic.url} 
            title={pic.title}
            position={[xPosition, 2, zPosition]} 
            rotation={[0, yRotation, 0]} 
          />
        )
      })}

      {/* Sàn nhà */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -130]}>
        <planeGeometry args={[10, 260]} />
        <meshStandardMaterial color="#404040" />
      </mesh>

      {/* --- TRẦN NHÀ (Đã xoay ngang) --- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -130]}>
        <planeGeometry args={[10, 260]} />
        <meshStandardMaterial color="#e0e0e0" side={THREE.DoubleSide} />
      </mesh>

      {/* --- TƯỜNG SAU LƯNG (Chặn lối ra khi mới vào) --- */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* --- TƯỜNG CUỐI HÀNH LANG & LỜI CHÀO TẠM BIỆT --- */}
      <group position={[0, 2.5, -255]}>
        {/* Bức tường đen */}
        <mesh>
          <boxGeometry args={[10, 5, 0.1]} />
          <meshStandardMaterial color="#151515" />
        </mesh>

        {/* Đèn rọi vàng hắt vào chữ cho lung linh */}
        <pointLight position={[0, 1, 2]} intensity={1.5} distance={10} color="#f8f885" />

        {/* Dòng chữ Cảm ơn */}
        <Text 
          position={[0, 0.5, 0.1]}     // Nhô ra trước 10cm để không bị chìm vào tường
          fontSize={0.35}              // Kích thước chữ to vừa phải
          color="white" 
          anchorX="center" 
          anchorY="middle"
          maxWidth={8}                 // Dàn đều chữ trong phạm vi 8m (tường rộng 10m)
          textAlign="center"
          lineHeight={1.5}             // Khoảng cách dòng thoáng mắt
        >
          Cảm ơn các bạn đã tham gia trải nghiệm!{"\n"}Hy vọng các bạn đã có những phút giây tuyệt vời cùng lịch sử.
        </Text>
      </group>

      {/* Tường trái */}
      <mesh position={[-5, 2.5, -130]}>
        <boxGeometry args={[0.2, 5, 260]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Tường phải */}
      <mesh position={[5, 2.5, -130]}>
        <boxGeometry args={[0.2, 5, 260]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

    </group>
  )
}

// 5. App Chính
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 1.6, 0], rotation : [0, 0, 0] }}> 
        <Suspense fallback={<Html center><h2 style={{ color: 'white', width: '200px' }}>Đang tải ảnh...</h2></Html>}>

          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
{/*          <Sky sunPosition={[100, 20, 100]} /> */}
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 0, 50]} />
          <ExhibitionGallery />

          <Player />
        </Suspense>
      </Canvas>
      
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '8px', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Triển lãm Hồ Chí Minh</h3>
        <p style={{ margin: '5px 0' }}>🖱️ <b>Click chuột</b> vào màn hình để bắt đầu</p>
        <p style={{ margin: '5px 0' }}>⌨️ Dùng <b>W, A, S, D</b> để di chuyển</p>
        <p style={{ margin: '5px 0' }}>⌨️ Nhấn <b>ESC</b> để thoát chuột</p>
      </div>
    </div>
  )
} 