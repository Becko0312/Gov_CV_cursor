import { Capacitor } from "@capacitor/core";

// Renders the given DOM element into a paginated A4 PDF.
// - On a native (Capacitor) platform the PDF is written to the device and the
//   native share/save sheet is opened so the user can store it in a local
//   folder, Drive, etc.
// - In a normal browser the PDF is downloaded directly.
export async function exportElementToPdf(element, filename) {
  if (!element) throw new Error("Хэвлэх агуулга олдсонгүй.");

  const { default: html2pdf } = await import("html2pdf.js");

  const opt = {
    margin: [8, 8, 8, 8],
    filename,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };

  if (Capacitor.isNativePlatform()) {
    const blob = await html2pdf().set(opt).from(element).outputPdf("blob");
    const base64 = await blobToBase64(blob);

    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      text: filename,
      files: [uri],
    });
  } else {
    await html2pdf().set(opt).from(element).save();
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
