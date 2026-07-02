import { useState, useRef, useEffect, useCallback } from "react";
import "./Promptpay.css";

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id, value) {
  return id + String(value.length).padStart(2, "0") + value;
}

function sanitizeDigits(s) {
  return (s || "").replace(/\D/g, "");
}

function detectTarget(raw) {
  const digits = sanitizeDigits(raw);
  if (digits.length === 10 && digits.startsWith("0")) {
    return {
      ok: true,
      tag: "01",
      value: "00" + "66" + digits.slice(1),
      label: "เบอร์โทรศัพท์",
    };
  }
  if (digits.length === 13) {
    return { ok: true, tag: "02", value: digits, label: "เลขบัตร ปชช. / ภาษี" };
  }
  if (digits.length === 15) {
    return { ok: true, tag: "03", value: digits, label: "e-Wallet ID" };
  }
  return { ok: false, digits };
}

function buildPayload(target, amountStr) {
  const merchantInfo =
    tlv("00", "A000000677010111") + tlv(target.tag, target.value);
  const hasAmount = !!amountStr;
  let payload =
    tlv("00", "01") +
    tlv("01", hasAmount ? "12" : "11") +
    tlv("29", merchantInfo) +
    tlv("53", "764");
  if (hasAmount) payload += tlv("54", amountStr);
  payload += tlv("58", "TH");
  const toCrc = payload + "6304";
  payload += tlv("63", crc16(toCrc));
  return payload;
}

export default function App() {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [generated, setGenerated] = useState(false);
  const [payload, setPayload] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [receiverLine, setReceiverLine] = useState("");
  const [libReady, setLibReady] = useState(
    !!(typeof window !== "undefined" && window.QRCode),
  );
  const [copied, setCopied] = useState(false);

  const qrRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.QRCode) {
      setLibReady(true);
      return;
    }
    const existing = document.querySelector('script[data-promptpay-qrlib="1"]');
    if (existing) {
      existing.addEventListener("load", () => setLibReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    script.dataset.promptpayQrlib = "1";
    script.onload = () => setLibReady(true);
    document.body.appendChild(script);
  }, []);

  const targetInfo = target.trim() === "" ? null : detectTarget(target);
  const targetError =
    target.trim() !== "" && targetInfo && !targetInfo.ok
      ? `พบ ${targetInfo.digits.length} หลัก — ต้องเป็น 10, 13 หรือ 15 หลัก`
      : "";

  const amountNum = amount.trim() === "" ? null : Number(amount);
  const amountError =
    amount.trim() !== "" &&
    (isNaN(amountNum) || amountNum <= 0 || amountNum > 999999.99)
      ? "กรอกจำนวนเงินที่มากกว่า 0 และไม่เกิน 999,999.99"
      : "";

  const canGenerate = !!(
    targetInfo &&
    targetInfo.ok &&
    !amountError &&
    libReady
  );

  const handleGenerate = useCallback(() => {
    if (!targetInfo || !targetInfo.ok || amountError || !window.QRCode) return;

    const amountStr = amount.trim() !== "" ? Number(amount).toFixed(2) : "";
    const newPayload = buildPayload(targetInfo, amountStr);

    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      new window.QRCode(qrRef.current, {
        text: newPayload,
        width: 220,
        height: 220,
        colorDark: "#221F19",
        colorLight: "#FFFFFF",
        correctLevel: window.QRCode.CorrectLevel.M,
      });
    }

    setPayload(newPayload);
    setDisplayAmount(
      amountStr
        ? Number(amountStr).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "",
    );
    setReceiverLine(`บัญชี: ${targetInfo.label} · ${targetInfo.value}`);
    setGenerated(true);
  }, [target, amount, targetInfo, amountError]);

  const handleDownload = useCallback(() => {
    setTimeout(() => {
      const canvas = qrRef.current && qrRef.current.querySelector("canvas");
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "promptpay-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }, 30);
  }, []);

  const handleCopy = useCallback(() => {
    if (!payload) return;
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [payload]);

  return (
    <div className="pp-page">
      <div className="pp-receipt">
        <div className="pp-zig" />
        <div className="pp-inner">
          <div className="pp-barcode" />

          <div className="pp-brand-row">
            <h1 className="pp-h1">พร้อมเพย์ QR</h1>
            <span className="pp-tag">EMVCo</span>
          </div>
          <p className="pp-sub">
            กรอกเบอร์โทร เลขบัตรประชาชน หรือเลขวอลเล็ต แล้วสร้าง QR
            สำหรับรับเงินจริง
          </p>

          <div className="pp-field">
            <label className="pp-label">
              หมายเลขพร้อมเพย์
              {targetInfo && targetInfo.ok && (
                <span className="pp-badge-type">{targetInfo.label}</span>
              )}
            </label>
            <input
              className="pp-input"
              type="text"
              inputMode="numeric"
              placeholder="0812345678 หรือ 1234567890123"
              autoComplete="off"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <div
              className={`pp-hint ${targetError ? "pp-hint-err" : targetInfo && targetInfo.ok ? "pp-hint-ok" : ""}`}
            >
              {targetError ||
                (targetInfo && targetInfo.ok
                  ? "รูปแบบถูกต้อง"
                  : "รองรับเบอร์โทร (10 หลัก) เลขบัตร ปชช./ภาษี (13 หลัก) หรือ e-Wallet (15 หลัก)")}
            </div>
          </div>

          <div className="pp-field">
            <label className="pp-label">
              จำนวนเงิน (บาท) — เว้นว่างได้ถ้าให้ผู้โอนกรอกเอง
            </label>
            <input
              className="pp-input"
              type="text"
              inputMode="decimal"
              placeholder="100.00"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className={`pp-hint ${amountError ? "pp-hint-err" : ""}`}>
              {amountError || "\u00A0"}
            </div>
          </div>

          <button
            className="pp-btn-generate"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {libReady ? "สร้าง QR Code" : "กำลังโหลด..."}
          </button>

          <div className={`pp-output ${generated ? "show" : ""}`}>
            <hr className="pp-divider" />

            <div className="pp-qr-wrap">
              <div ref={qrRef} />
            </div>

            {displayAmount && (
              <div className="pp-amount-line">
                <div className="pp-amount-label">จำนวนเงิน</div>
                <div className="pp-amount-value">{displayAmount} บาท</div>
              </div>
            )}

            <div className="pp-recv-line">{receiverLine}</div>

            <div className="pp-actions">
              <button className="pp-action-btn" onClick={handleDownload}>
                ดาวน์โหลด PNG
              </button>
              <button className="pp-action-btn" onClick={handleCopy}>
                {copied ? "คัดลอกแล้ว" : "คัดลอกข้อมูล"}
              </button>
            </div>

            <div className="pp-payload-box">{payload}</div>
          </div>

          <div className="pp-footnote">
            ข้อมูลทั้งหมดประมวลผลในเบราว์เซอร์ของคุณเท่านั้น
            ไม่มีการส่งออกไปเซิร์ฟเวอร์ใด ๆ
            <br />
            ทดสอบสแกนด้วยแอปธนาคารจริงก่อนใช้งานจริงเสมอ
          </div>
        </div>
        <div className="pp-zig pp-zig-bottom" />
      </div>
    </div>
  );
}
