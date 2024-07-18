"use client";
import Image, { StaticImageData } from "next/image";
import { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import CompanyLogo from "../../public/assets/logo-company.png";

export default function Home() {
  const [image, setImage] = useState<string>("");
  const [startNumbers, setStartNumbers] = useState<string[]>(Array(7).fill(""));
  const [endNumbers, setEndNumbers] = useState<string[]>(Array(7).fill(""));
  const ticketRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formats, setFormat] = useState<string>("A");
  const [codeType, setCodeType] = useState<string>("BAR");

  const colors = [
    "#f8b400",
    "#f85f73",
    "#6a0572",
    "#00bcd4",
    "#3f51b5",
    "#ff4081",
    "#689f38",
    "#f8b401",
    "#f85f74",
    "#6a0573",
    "#00bcd5",
    "#3f51b6",
    "#ff4082",
    "#689f39",
  ];
  const [currentColor, setCurrentColor] = useState<string>(colors[0]);

  useEffect(() => {
    if (ticketRef.current) {
      const ticket = { number: image, color: currentColor };
      setImage(ticket.number);
      setCurrentColor(ticket.color);
    }
  }, [image, currentColor]);

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const pdfDoc = await PDFDocument.create();

      const pageWidth = 28.9 * 28.35;
      const pageHeight = 39.4 * 28.35;

      const marginLeft = 1 * 28.35;
      const marginRight = 1 * 28.35;
      const marginTop = 1 * 28.35;
      const ticketGap = 0.39 * 28.35;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let yPosition = pageHeight - marginTop;

      const centerX = marginLeft + (pageWidth - marginLeft - marginRight) / 2;

      const drawText = (
        page: PDFPage,
        format: string,
        centerX: number,
        pageHeight: number,
      ) => {
        const fontSize = 10;
        const textYPosition = pageHeight - 10;
        page.drawText(format, {
          x: centerX,
          y: textYPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      };

      let currentPageFormat = formats;

      const toggleFormat = () => {
        currentPageFormat = formats;
      };

      drawText(page, currentPageFormat, centerX, pageHeight);

      interface Ticket {
        number: string;
        color: string;
      }

      const tickets: Ticket[] = [];

      for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const start = parseInt(startNumbers[colorIndex]);
        const end = parseInt(endNumbers[colorIndex]);

        if (isNaN(start) || isNaN(end)) continue;

        for (let i = start; i <= end; i++) {
          tickets.push({
            number: i.toString().padStart(10, "0"),
            color: colors[colorIndex],
          });
        }
      }

      const groupedTickets: { [key: string]: Ticket[] } = tickets.reduce(
        (acc: { [key: string]: Ticket[] }, ticket) => {
          const color = ticket.color;
          if (!acc[color]) {
            acc[color] = [];
          }
          acc[color].push(ticket);
          return acc;
        },
        {},
      );

      const keys = Object.keys(groupedTickets);
      let result: Ticket[] = [];
      for (let i = 0; i < groupedTickets[keys[0]]?.length; i++) {
        for (let j = 0; j < keys.length; j++) {
          if (groupedTickets[keys[j]][i]) {
            result.push(groupedTickets[keys[j]][i]);
          }
        }
      }
      const mixedTickets = result;

      const offset = -15; // Sesuaikan nilai offset sesuai kebutuhan Anda

      let ticketCount = 0;

      for (let i = 0; i < mixedTickets.length; i++) {
        const ticket = mixedTickets[i];
        setImage(ticket.number);
        setCurrentColor(ticket.color);

        if (ticketRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(ticketRef.current);
          const imageDataUrl = canvas.toDataURL("image/jpeg");
          const imageBytes = await fetch(imageDataUrl).then((res) =>
            res.arrayBuffer(),
          );
          const pdfImage = await pdfDoc.embedJpg(imageBytes);

          if (ticketCount > 0 && (ticketCount + 1) % 15 === 0) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - marginTop;
            ticketCount = 0;

            toggleFormat();
            drawText(page, currentPageFormat, centerX, pageHeight);
          }

          const ticketWidth = (23.4) * 28.35;
          const ticketHeight = 2.31 * 28.35;

          page.drawImage(pdfImage, {
            x:
              marginLeft +
              (pageWidth - marginLeft - marginRight - ticketWidth) / 2,
            y: yPosition - ticketHeight - ticketGap - offset,
            width: ticketWidth,
            height: ticketHeight,
          });

          if ((ticketCount + 1) % 7 === 0 && (ticketCount + 1) % 14 !== 0) {
            yPosition -= ticketHeight + 1.25 * 28.35;
          } else {
            yPosition -= ticketHeight + ticketGap;
          }

          ticketCount++;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Tickets-${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    index: number,
    type: "start" | "end",
    value: string,
  ) => {
    if (type === "start") {
      const newStartNumbers = [...startNumbers];
      newStartNumbers[index] = value;
      setStartNumbers(newStartNumbers);
    } else {
      const newEndNumbers = [...endNumbers];
      newEndNumbers[index] = value;
      setEndNumbers(newEndNumbers);
    }
  };

  const date: Date = new Date();
  const months: string[] = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const day: number = date.getDate();
  const month: string = months[date.getMonth()];
  const year: number = date.getFullYear();

  return (
    <main className="flex flex-col items-center justify-center w-full p-24 bg-sky-950">
      <div className="flex flex-col justify-center items-center gap-6 p-6 bg-sky-500 rounded-md">
        <div className="flex flex-row justify-start">
          <Image
            src={CompanyLogo as StaticImageData}
            alt="Logo"
            className="w-52 "
          />
        </div>
        {/* card tiket */}
        <div
          ref={ticketRef}
          className="absolute overflow-hidden w-[24.6cm] min-w-[24.6cm] h-[2.3cm] min-h-[2.3cm] max-w-[24.6cm] max-h-[2.3cm] m-0 p-0 overflow-hidden"
          style={{ color: "#000000" }}
        >
          <div className={`w-[24cm] min-w-[24cm] h-[2.3cm] min-h-[2.3cm] max-w-[24cm] max-h-[2.3cm] m-0 p-0 flex flex-row items-center justify-between -z-10 absolute left-2.5 pr-[4mm]`}>
            <div className="w-[25%] flex flex-row items-center justify-center align-middle content-center text-center overflow-hidden p-0 m-0">
              {codeType !== "QR" && (
                <p
                  className="text-center whitespace-nowrap w-full mb-3 text-xs -ml-16 "
                  style={{ color: "#000000" }}
                >
                  {image}
                </p>
              )}
            </div>
            <div className="flex w-[50%] flex-row gap-4 items-center justify-end">
              {codeType === "QR" && (
                <div className="flex self-start mr-[18mm] mt-0">
                  <h5 className="font-medium font-roboto-mono">{image}</h5>
                </div>
              )}
              {codeType !== "QR" && (
                <Barcode
                  value={image}
                  height={40}
                  width={1.1}
                  fontSize={10}
                  background="none"
                  marginLeft={110}
                />
              )}
              {codeType === "QR" && (
                <QRCode className="w-[1.7cm] h-[1.7cm]" value={image} />
              )}
            </div>
          </div>
          <div className="absolute top-0 left-0 w-[0.3cm] h-[1px] bg-black"></div>
          <div className="absolute top-0 right-0 w-[0.3cm] h-[1px] bg-black"></div>
          <div className="absolute bottom-0 left-0 w-[0.3cm] h-[1px] bg-black"></div>
          <div className="absolute bottom-0 right-0 w-[0.3cm] h-[1px] bg-black"></div>
        </div>

        <div className="flex flex-row justify-start w-full">
          <div className="w-full flex flex-col gap-3 items-center justify-between">
            {colors.map((itemColor, index) => (
              <div
                key={index}
                className="w-full flex items-center justify-between"
              >
                <label
                  htmlFor={`start_number_${index + 1}`}
                  className={`min-w-[140px] font-semibold`}
                  style={{ color: `${itemColor}` }}
                >
                  WARNA {index + 1}
                </label>
                <div className="flex flex-row gap-3 items-center min-w-[200px]">
                  <input
                    id={`start_number_${index + 1}`}
                    type="text"
                    className="p-[5px] rounded-md text-black w-50"
                    placeholder={`Start Number '0000000'`}
                    value={startNumbers[index]}
                    onChange={(e) =>
                      handleInputChange(index, "start", e.target.value)
                    }
                  />
                  <input
                    id={`end_number_${index + 1}`}
                    type="text"
                    className="p-[5px] rounded-md text-black w-50"
                    placeholder={`End Number '0000000'`}
                    value={endNumbers[index]}
                    onChange={(e) =>
                      handleInputChange(index, "end", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <div className="w-full flex items-center justify-between gap-4">
              <label htmlFor="file_input">FORMAT</label>
              <div className="flex flex-row gap-3 items-center w-full justify-end">
                <div className="flex flex-row gap-3 min-w-[200px] w-[33rem] justify-between">
                  <div className="flex items-center justify-start gap-3 w-50">
                    <label htmlFor="qr">Qr Code</label>
                    <input
                      type="radio"
                      id="qr"
                      name="qr"
                      value="QR"
                      checked={codeType === "QR"}
                      onChange={() => setCodeType("QR")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="bar">Barcode</label>
                    <input
                      type="radio"
                      id="bar"
                      name="bar"
                      value="BAR"
                      checked={codeType === "BAR"}
                      onChange={() => setCodeType("BAR")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div className="flex items-center justify-start gap-3 w-50">
                    <label htmlFor="formatA">Format A</label>
                    <input
                      type="radio"
                      id="formatA"
                      name="format"
                      value="A"
                      checked={formats === "A"}
                      onChange={() => setFormat("A")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="formatC">Format C</label>
                    <input
                      type="radio"
                      id="formatC"
                      name="format"
                      value="C"
                      checked={formats === "C"}
                      onChange={() => setFormat("C")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex items-center justify-center cursor-pointer">
              <button
                disabled={loading}
                type="button"
                className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                onClick={handleGeneratePDF}
              >
                {loading ? (
                  <Barcode
                    value={image}
                    height={20}
                    width={1.1}
                    fontSize={10}
                    background="none"
                  />
                ) : (
                  "GENERATE PDF"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
