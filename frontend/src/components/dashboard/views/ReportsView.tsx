import React from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Download, FileText, PieChart } from 'lucide-react';
import { formatCurrency } from '../../../lib/format';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ReportsView() {
  const { t } = useLanguage();
  const { getMonthlyIncome, getMonthlyExpense, getTotalBalance, transactions, profile } = useFinance();

  const handleExportExcel = async () => {
    if (transactions.length === 0) {
      alert(t("custom.reportNoDataExport"));
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Monevra';
    workbook.created = new Date();
    
    const sheet = workbook.addWorksheet(t('custom.reportRawDataSheet'));

    // Kolom dan Lebar
    sheet.columns = [
      { header: t('custom.reportColId'), key: 'id', width: 10 },
      { header: t('custom.reportColDate'), key: 'date', width: 15 },
      { header: t('custom.reportColTitle'), key: 'title', width: 35 },
      { header: t('custom.reportColCategory'), key: 'category', width: 20 },
      { header: t('custom.reportColType'), key: 'type', width: 15 },
      { header: t('custom.reportWalletSource'), key: 'wallet', width: 20 },
      { header: t('custom.reportColAmount'), key: 'amount', width: 20 },
      { header: t('custom.reportColCurrency'), key: 'currency', width: 15 },
      { header: t('custom.reportColStatus'), key: 'status', width: 15 },
    ];

    // Styling Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF06B6D4' } // Cyan-500
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Data Rows
    transactions.forEach((tx) => {
      const isIncome = tx.type === 'income';
      const row = sheet.addRow({
        id: tx.id,
        date: tx.date,
        title: tx.title,
        category: tx.category,
        type: isIncome ? t('custom.reportIncome') : t('custom.reportExpense'),
        wallet: tx.wallet,
        amount: Math.abs(tx.amount), // absolute value for clean formatting
        currency: profile.currency,
        status: tx.status
      });

      // Styling Number
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('amount').font = { 
        color: { argb: isIncome ? 'FF10B981' : 'FFF43F5E' }, 
        bold: true 
      };
      
      row.alignment = { vertical: 'middle' };
      row.getCell('type').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };
    });

    // Auto filter to make it look like a real data table
    sheet.autoFilter = 'A1:I1';

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Monevra_Transaksi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    // A simple approach is to trigger the print dialog which allows "Save as PDF"
    window.print();
  };

  return (
    <>
      {/* UI for Screen */}
      <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6 text-slate-200 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-200">{t('dashboard.reports')}</h2>
            <p className="text-slate-400 text-sm">{t('custom.reportDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-[2rem] p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-200">{t('custom.reportExecutive')}</h3>
                <p className="text-sm text-slate-400">{t('custom.reportPdfDesc')}</p>
              </div>
            </div>
            <div className="bg-surface-dark rounded-xl p-4 text-sm text-slate-300 space-y-2">
              <div className="flex justify-between"><span>{t('custom.walletCurrentBalance')}:</span> <span className="font-bold">{formatCurrency(getTotalBalance(), profile.currency)}</span></div>
              <div className="flex justify-between"><span>{t('custom.reportTotalIncome')}</span> <span className="text-green-400 font-bold">+{formatCurrency(getMonthlyIncome(), profile.currency)}</span></div>
              <div className="flex justify-between"><span>{t('custom.reportTotalExpense')}</span> <span className="text-red-400 font-bold">-{formatCurrency(getMonthlyExpense(), profile.currency)}</span></div>
            </div>
            <button 
              onClick={handleExportPDF}
              className="btn-premium w-full mt-auto"
            >
              <Download size={18} /> {t('custom.reportPrintPdf')}
            </button>
          </div>

          <div className="glass-card rounded-[2rem] p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center">
                <PieChart size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-200">{t('custom.reportRawData')}</h3>
                <p className="text-sm text-slate-400">{t('custom.reportExcelDesc')}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 flex-1">
              {t('custom.reportExcelDesc')}
            </p>
            <button 
              onClick={handleExportExcel}
              className="btn-premium-success w-full mt-auto"
            >
              <Download size={18} /> {t('custom.reportExcelBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Print-Only Template (Invoice Style) */}
      <div className="hidden print:block w-full max-w-[21cm] mx-auto bg-white text-black p-10 font-sans relative overflow-hidden min-h-[29.7cm]">
        
        {/* Background Waves (Top Left) */}
        <svg className="absolute top-0 left-0 w-[400px] h-[400px] -translate-x-1/4 -translate-y-1/4 text-sky-300 pointer-events-none opacity-40" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M-50,100 Q50,-20 150,100 T350,100" />
          <path d="M-50,105 Q50,-15 150,105 T350,105" />
          <path d="M-50,110 Q50,-10 150,110 T350,110" />
          <path d="M-50,115 Q50,-5 150,115 T350,115" />
          <path d="M-50,120 Q50,0 150,120 T350,120" />
          <path d="M-50,125 Q50,5 150,125 T350,125" />
          <path d="M-50,130 Q50,10 150,130 T350,130" />
          <path d="M-50,135 Q50,15 150,135 T350,135" />
          <path d="M-50,140 Q50,20 150,140 T350,140" />
          <path d="M-50,145 Q50,25 150,145 T350,145" />
        </svg>

        {/* Background Waves (Bottom Right) */}
        <svg className="absolute bottom-0 right-0 w-[500px] h-[500px] translate-x-1/4 translate-y-1/4 text-sky-300 pointer-events-none opacity-40" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M-150,100 Q-50,220 50,100 T250,100" />
          <path d="M-150,105 Q-50,225 50,105 T250,105" />
          <path d="M-150,110 Q-50,230 50,110 T250,110" />
          <path d="M-150,115 Q-50,235 50,115 T250,115" />
          <path d="M-150,120 Q-50,240 50,120 T250,120" />
          <path d="M-150,125 Q-50,245 50,125 T250,125" />
          <path d="M-150,130 Q-50,250 50,130 T250,130" />
          <path d="M-150,135 Q-50,255 50,135 T250,135" />
          <path d="M-150,140 Q-50,260 50,140 T250,140" />
          <path d="M-150,145 Q-50,265 50,145 T250,145" />
        </svg>

        {/* Center Wave Watermark */}
        <svg className="absolute top-1/2 left-1/2 w-[600px] h-[300px] -translate-x-1/2 -translate-y-1/2 text-sky-200 pointer-events-none opacity-20" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M-50,50 Q50,-20 150,50 T350,50" />
          <path d="M-50,55 Q50,-15 150,55 T350,55" />
          <path d="M-50,60 Q50,-10 150,60 T350,60" />
          <path d="M-50,65 Q50,-5 150,65 T350,65" />
        </svg>

        {/* Header Section */}
        <div className="flex justify-between items-start mb-16 relative z-10">
          <div>
            <h1 className="text-[2.5rem] font-bold tracking-[0.3em] text-slate-900 mb-2">INVOICE</h1>
            <p className="text-slate-500 text-xs tracking-widest font-medium">No. INV-{new Date().getFullYear()}{(new Date().getMonth()+1).toString().padStart(2, '0')}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-28 h-28 mb-4 relative group">
               <div className="absolute inset-0 bg-brand-400/10 blur-xl rounded-full"></div>
               <img src="/logo-monevra.png" alt="Monevra Logo" className="w-full h-full object-contain filter drop-shadow-xl relative z-10" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2">KEPADA</p>
            <p className="font-bold text-slate-900 text-sm uppercase tracking-[0.15em] mb-1">{profile.name}</p>
            <p className="text-slate-600 text-xs mb-1">{profile.email}</p>
            <p className="text-slate-500 text-[10px]">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-brand-100 py-3 px-8 grid grid-cols-12 font-bold text-slate-800 text-xs tracking-wider mb-8 relative z-10">
          <div className="col-span-5 uppercase">{t('custom.reportColDesc')}</div>
          <div className="col-span-2 uppercase">KATEGORI</div>
          <div className="col-span-2 text-center uppercase">{t('custom.reportWallet')}</div>
          <div className="col-span-3 text-right uppercase">TOTAL</div>
        </div>

        {/* Table Body */}
        <div className="space-y-6 px-8 relative z-10">
          {transactions.slice(0, 20).map((tx, i) => (
            <div key={tx.id} className="grid grid-cols-12 text-sm text-slate-800 items-start">
              <div className="col-span-5 pr-4">
                <p className="font-bold tracking-[0.1em] uppercase text-slate-900 mb-1">{tx.title}</p>
                <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="col-span-2 font-medium tracking-wide text-xs pt-1">{tx.category}</div>
              <div className="col-span-2 text-center font-medium tracking-wide text-xs pt-1">{tx.wallet}</div>
              <div className="col-span-3 text-right font-bold tracking-wider whitespace-nowrap pt-1">
                {tx.type === 'income' ? '' : '-'} {formatCurrency(Math.abs(tx.amount), profile.currency).replace(profile.currency, profile.currency + ' ')}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-slate-500 italic py-4 text-center">Belum ada transaksi di periode ini.</p>
          )}
        </div>

        {/* Dotted Line */}
        <div className="border-t border-dashed border-slate-300 my-10 relative z-10"></div>

        {/* Totals Section */}
        <div className="flex justify-between items-start px-8 mb-8 relative z-10">
          <div className="w-1/2">
            {/* Empty space on left like invoice */}
          </div>
          <div className="w-1/2 space-y-5">
            <div className="flex justify-between font-bold text-slate-800 text-sm tracking-wider">
              <span>{t('custom.reportTotalIncomeLbl')}</span>
              <span>{formatCurrency(getMonthlyIncome(), profile.currency).replace(profile.currency, profile.currency + ' ')}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 text-sm tracking-wider">
              <span className="uppercase">{t('custom.reportTotalExpenseLbl')}</span>
              <span>{formatCurrency(getMonthlyExpense(), profile.currency).replace(profile.currency, profile.currency + ' ')}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-brand-100 py-5 px-8 flex justify-between items-center font-bold text-slate-900 tracking-wider mb-16 relative z-10">
          <span className="text-sm">{t('custom.reportColGrandTotal')}</span>
          <span className="text-lg">{formatCurrency(getTotalBalance(), profile.currency).replace(profile.currency, profile.currency + ' ')}</span>
        </div>


      </div>
    </>
  );
}
