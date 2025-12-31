import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Appointment, PrescriptionItem, InvestigationItem, PrintSettings, TabPrintConfig, PrintElement } from '../types';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ... Data parsing helpers ...
const createDataBlockContent = (type: 'rx' | 'requests' | 'reports', patient: Partial<Appointment>, element: PrintElement) => {
    let html = '';
    
    // Force black color styles inline for perfect printing
    const baseStyle = 'color: #000000; opacity: 1;';
    const showHeader = element.showSectionHeader !== false; // Default true
    const layout = element.dataLayout || 1;
    const fontSize = element.fontSize || 12;

    if (type === 'rx') {
        if (showHeader) {
            html += `<div style="font-weight: 900; font-size: ${fontSize * 1.5}px; margin-bottom: 15px; font-style: italic; ${baseStyle}">Rx</div>`;
        }
        
        if (patient.prescription && patient.prescription.length > 0) {
            // All layouts now strictly use: Drug | Frequency | Duration
            
            // Layout 1: Standard Table with Borders
            if (layout === 1) {
                html += `
                    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; ${baseStyle}">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 50%;">Drug Name</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 25%;">Frequency</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 25%;">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${patient.prescription.map(p => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${fontSize}px;">${p.drug} ${p.dose ? `(${p.dose})` : ''}</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.frequency}</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.duration || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } 
            // Layout 2: Clean Line Style
            else if (layout === 2) {
                html += `
                    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; ${baseStyle}">
                        <thead>
                            <tr style="border-bottom: 2px solid #000;">
                                <th style="padding: 8px 4px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 50%;">Drug Name</th>
                                <th style="padding: 8px 4px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 25%;">Frequency</th>
                                <th style="padding: 8px 4px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; width: 25%;">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${patient.prescription.map(p => `
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px 4px; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${fontSize}px;">${p.drug} ${p.dose ? `(${p.dose})` : ''}</td>
                                    <td style="padding: 10px 4px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.frequency}</td>
                                    <td style="padding: 10px 4px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.duration || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
            // Layout 3: Compact Grid
            else if (layout === 3) {
                html += `
                    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; ${baseStyle}">
                        <thead>
                            <tr style="background-color: #000; color: #fff;">
                                <th style="padding: 6px 10px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; color: #fff; width: 50%;">DRUG</th>
                                <th style="padding: 6px 10px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; color: #fff; width: 25%;">FREQ</th>
                                <th style="padding: 6px 10px; text-align: center; vertical-align: middle; font-size: ${fontSize}px; color: #fff; width: 25%;">DUR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${patient.prescription.map((p, i) => `
                                <tr style="background-color: ${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
                                    <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-weight: 900; font-size: ${fontSize}px;">${p.drug} ${p.dose ? `(${p.dose})` : ''}</td>
                                    <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.frequency}</td>
                                    <td style="padding: 8px 10px; text-align: center; vertical-align: middle; font-size: ${fontSize}px;">${p.duration || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
    } else if (type === 'requests') {
        if (showHeader) {
            html += `<div style="font-weight: 900; font-size: ${fontSize * 1.2}px; margin-bottom: 15px; text-decoration: underline; ${baseStyle}">Requested Investigations</div>`;
        }
        if ((patient.investigationItems?.length || 0) > 0 || (patient.scans?.length || 0) > 0) {
            html += `<ul style="font-weight: bold; font-size: ${fontSize}px; line-height: 1.6; list-style-type: disc; padding-left: 20px; ${baseStyle}">`;
            patient.investigationItems?.forEach(i => html += `<li>${i.name}</li>`);
            patient.scans?.forEach(s => html += `<li>${s.name}</li>`);
            html += `</ul>`;
        }
    } else {
        if (showHeader) {
            html += `<div style="text-align: center; font-weight: 900; font-size: ${fontSize * 1.4}px; margin-bottom: 20px; ${baseStyle}">MEDICAL REPORT</div>`;
        }
        if (patient.pastHistory) {
             html += `<div style="font-size: ${fontSize}px; line-height: 1.6; text-align: justify; white-space: pre-wrap; ${baseStyle}">${patient.pastHistory}</div>`;
        }
        if (patient.diagnosis) {
             html += `<div style="margin-top: 20px; font-weight: bold; font-size: ${fontSize}px; ${baseStyle}">Diagnosis: ${patient.diagnosis}</div>`;
        }
    }
    return html;
};

const parsePlaceholders = (text: string, patient: Partial<Appointment>, settings: PrintSettings) => {
    return text
        .replace('{{CLINIC_NAME}}', settings.clinicName || '')
        .replace('{{DOCTOR_NAME}}', settings.doctorName || '')
        .replace('{{SPECIALTY}}', settings.specialty || '')
        .replace('{{DATE}}', patient.date || new Date().toLocaleDateString())
        .replace('{{PATIENT_NAME}}', patient.name || '')
        .replace('{{AGE}}', patient.age ? `${patient.age}Y` : '')
        .replace('{{PHONES}}', settings.phones.join(' | '))
        .replace('{{ADDRESSES}}', settings.addresses.join(' - '))
        // Individual Vitals
        .replace('{{WEIGHT}}', patient.weight ? `${patient.weight}kg` : '')
        .replace('{{HEIGHT}}', patient.height ? `${patient.height}cm` : '')
        .replace('{{BP}}', patient.vitals?.bp || '')
        .replace('{{HR}}', patient.vitals?.hr || '')
        .replace('{{TEMP}}', patient.vitals?.temp || '')
        .replace('{{O2}}', patient.vitals?.rr || ''); // Reusing RR for O2 or similar if needed
};

const createPageElement = (
    config: TabPrintConfig, 
    settings: PrintSettings, 
    patient: Partial<Appointment>,
    type: 'rx' | 'requests' | 'reports'
) => {
    // 3.78 px per mm is roughly 96 DPI.
    const MM_TO_PX = 3.7795275591; 
    const paperDims = config.paperSize === 'A4' ? { w: 210, h: 297 } : { w: 148, h: 210 };

    const page = document.createElement('div');
    page.className = 'print-page';
    // Use fixed pixel size matching standard print resolution for consistency
    page.style.width = `${paperDims.w * MM_TO_PX}px`;
    page.style.height = `${paperDims.h * MM_TO_PX}px`;
    page.style.position = 'relative';
    page.style.overflow = 'hidden';
    page.style.backgroundColor = 'white';
    page.style.color = 'black'; 
    page.dir = 'ltr';

    if (config.backgroundUrl) {
        page.style.backgroundImage = `url(${config.backgroundUrl})`;
        page.style.backgroundSize = '100% 100%';
    }

    config.elements.forEach(el => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${el.x}%`;
        div.style.top = `${el.y}%`;
        div.style.width = `${el.w}%`;
        div.style.height = `${el.h}%`;
        div.style.zIndex = `${el.zIndex || 10}`;
        div.style.color = '#000000'; // Force black
        div.style.overflow = 'visible'; // Allow data blocks to spill if needed

        if (el.type === 'text' && el.content) {
            div.innerText = parsePlaceholders(el.content, patient, settings);
            div.style.fontSize = `${el.fontSize || 12}px`;
            div.style.fontWeight = el.fontWeight || 'normal';
            div.style.textAlign = el.align || 'left';
            div.style.lineHeight = '1.2';
            div.style.whiteSpace = 'pre-wrap';
        } else if (el.type === 'image' && el.content) {
            const img = document.createElement('img');
            img.src = el.content;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            div.appendChild(img);
        } else if (el.type === 'data_block') {
            div.innerHTML = createDataBlockContent(type, patient, el);
            div.style.fontSize = `${el.fontSize || 12}px`;
        }

        page.appendChild(div);
    });

    return page;
};

// Exported for sample generation
export const generatePDF = async (patient: Partial<Appointment>, config: TabPrintConfig, settings: PrintSettings, filename: string, type: 'rx' | 'requests' | 'reports') => {
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.left = '-10000px';
    hiddenContainer.style.top = '0';
    document.body.appendChild(hiddenContainer);

    const pageEl = createPageElement(config, settings, patient, type);
    hiddenContainer.appendChild(pageEl);

    try {
        const canvas = await html2canvas(pageEl, { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const paperDims = config.paperSize === 'A4' ? { w: 210, h: 297 } : { w: 148, h: 210 };

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [paperDims.w, paperDims.h]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, paperDims.w, paperDims.h);
        pdf.save(`${filename}.pdf`);
    } catch (e) {
        console.error("PDF Generation Error", e);
        alert("Failed to generate PDF.");
    } finally {
        document.body.removeChild(hiddenContainer);
    }
};

export const printPrescription = async (patientName: string, date: string, items: PrescriptionItem[], settings: PrintSettings) => {
    const dummyPatient: Partial<Appointment> = { name: patientName, date: date, prescription: items };
    await generatePDF(dummyPatient, settings.rx, settings, `Rx_${patientName}`, 'rx');
};

export const printInvestigations = async (patientName: string, date: string, labs: InvestigationItem[], scans: InvestigationItem[], settings: PrintSettings) => {
    const dummyPatient: Partial<Appointment> = { name: patientName, date: date, investigationItems: labs, scans: scans };
    await generatePDF(dummyPatient, settings.requests, settings, `Requests_${patientName}`, 'requests');
};

export const generatePatientReportPDF = async (patient: Appointment, settings: PrintSettings) => {
    await generatePDF(patient, settings.reports, settings, `Report_${patient.name}`, 'reports');
};

export const printSessionRequests = async (patient: Appointment, settings: PrintSettings) => {
    await generatePDF(patient, settings.requests, settings, `Session_${patient.name}`, 'requests');
};
