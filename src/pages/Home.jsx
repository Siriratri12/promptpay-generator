import { Link } from "react-router-dom";
import "./Home.css";

const FEATURES = [
  {
    title: "Fast Generation",
    desc: "สร้าง QR Code ได้ทันที",
  },
  {
    title: "Multiple Identifier Support",
    desc: "รองรับเบอร์โทรศัพท์ เลขบัตรประชาชน และเลขผู้เสียภาษี",
  },
  {
    title: "Privacy First",
    desc: "สร้าง QR Code ภายในเบราว์เซอร์โดยไม่ส่งข้อมูลออกจากอุปกรณ์",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-receipt">
        <div className="home-zig" />
        <div className="home-inner">
          <div className="home-barcode" />

          <div className="home-brand-row">
            <span className="home-h1">พร้อมเพย์ QR</span>
            <span className="home-tag">EMVCo</span>
          </div>

          <h1 className="home-hero">
            PromptPay QR Generator
            <br />
            ใช้งานได้จริงใน 3 วินาที
          </h1>
          <p className="home-sub">
            กรอกหมายเลขพร้อมเพย์และยอดเงิน แล้วได้ QR Code
            ที่แอปธนาคารสแกนแล้วขึ้นชื่อบัญชีและยอดเงินถูกต้องทันที
          </p>

          <ul className="home-features">
            {FEATURES.map((f) => (
              <li className="home-feature" key={f.title}>
                <span className="home-feature-dot" />
                <div>
                  <div className="home-feature-title">{f.title}</div>
                  <div className="home-feature-desc">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          <Link to="/promptpay" className="home-cta-link">
            <button className="home-cta">สร้าง QR Code</button>
          </Link>

          <div className="home-footnote">
            ฟรี ไม่ต้องสมัครสมาชิก ไม่เก็บข้อมูลของคุณ
          </div>
        </div>
        <div className="home-zig home-zig-bottom" />
      </div>
    </div>
  );
}
