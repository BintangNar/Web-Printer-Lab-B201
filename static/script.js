document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // BAGIAN 0: LOGIKA NAVIGASI HALAMAN (SPA ROUTING)
    // ========================================================
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const featureLinks = document.querySelectorAll('.feature-card-link');
    const BASE_URL = 'http://127.0.0.1:8000';

    const showPage = (pageId) => {
        pages.forEach(page => {
            page.style.display = page.id === pageId ? 'block' : 'none';
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.hash === `#${pageId.replace('page-', '')}`);
        });

        window.location.hash = pageId.replace('page-', '');
    };

    const handleNavigation = (event) => {
        event.preventDefault();
        const pageId = `page-${event.currentTarget.hash.substring(1)}`;
        showPage(pageId);
    };

    navLinks.forEach(link => link.addEventListener('click', handleNavigation));
    featureLinks.forEach(link => link.addEventListener('click', handleNavigation));

    const loadPageFromHash = () => {
        const hash = window.location.hash.substring(1);
        const pageId = hash ? `page-${hash}` : 'page-home';
        showPage(pageId);
    };

    loadPageFromHash(); // Tampilkan halaman berdasarkan URL saat pertama kali dimuat

    // ========================================================
    // FUNGSI VALIDASI DAN UTILITIES UMUM
    // ========================================================
    function areFilesValidPDF(fileList) {
        for (const file of fileList) {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                return false;
            }
        }
        return true;
    }

    function setupFileInput(inputId, labelSelector, infoId) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput) return;
        const fileLabel = document.querySelector(labelSelector);
        if (!fileLabel) return;
        const originalLabelText = fileLabel.textContent;
        const infoElement = document.getElementById(infoId);

        fileInput.addEventListener('change', () => {
            if (infoElement) infoElement.textContent = '';
            if (fileInput.files.length > 0) {
                if (!areFilesValidPDF(fileInput.files)) {
                    alert('Error: Harap pilih hanya file dengan format PDF.');
                    fileInput.value = '';
                    fileLabel.textContent = originalLabelText;
                    return;
                }
                const file = fileInput.files[0];
                if (infoElement) {
                    if (fileInput.files.length > 1) {
                        infoElement.textContent = `${fileInput.files.length} file dipilih.`;
                    } else {
                        infoElement.textContent = 'Membaca file...';
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const typedarray = new Uint8Array(e.target.result);
                            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                                infoElement.textContent = `File: ${file.name} (${pdf.numPages} halaman)`;
                                if (inputId === 'file-upload') {
                                    const pageFromInput = document.getElementById('page-from');
                                    const pageToInput = document.getElementById('page-to');
                                    if (pageFromInput && pageToInput) {
                                        pageFromInput.max = pdf.numPages;
                                        pageToInput.max = pdf.numPages;
                                    }
                                }
                            });
                        };
                        reader.readAsArrayBuffer(file);
                    }
                }
                fileLabel.textContent = fileInput.files.length === 1 ? file.name : `${fileInput.files.length} file PDF dipilih`;
            } else {
                fileLabel.textContent = originalLabelText;
            }
        });
    }

    setupFileInput('file-upload', 'label[for="file-upload"]', 'print-pdf-info');
    setupFileInput('pdf-split', 'label[for="pdf-split"]', 'pdf-info');

    // ========================================================
    // BAGIAN 1: LOGIKA UNTUK FITUR PRINT
    // ========================================================
const printButton = document.getElementById('print-btn');
const queueList = document.getElementById('queue-list');

function addToQueue(fileName, details) {
    if (!queueList) return;
    const listItem = document.createElement('li');
    const detailsElement = `<small style="color: #555; display: block; margin-top: 4px;">${details}</small>`;
    listItem.innerHTML = `${fileName} - <span>Waiting</span>${detailsElement}`;
    const emptyMessage = queueList.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();
    queueList.appendChild(listItem);
}

function initializeQueue() {
    if (queueList && !queueList.querySelector('li')) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Antrean cetak kosong.';
        emptyMessage.classList.add('empty-message');
        queueList.appendChild(emptyMessage);
    }
}

if (printButton) {
    printButton.addEventListener('click', async () => {
        const fileInput = document.getElementById('file-upload');
        if (fileInput.files.length === 0) return alert('Silakan pilih file PDF untuk dicetak.');

        const colorOption = document.querySelector('input[name="print-color"]:checked').value;
        const pageFrom = document.getElementById('page-from').value;
        const pageTo = document.getElementById('page-to').value;
        if (pageFrom && pageTo && parseInt(pageFrom) > parseInt(pageTo))
            return alert('Halaman "Dari" tidak boleh lebih besar dari halaman "Sampai".');

        let pageDesc = "Semua Halaman";
        let pagesParam = "";
        if (pageFrom && pageTo) {
            pageDesc = `Halaman ${pageFrom} - ${pageTo}`;
            pagesParam = `${pageFrom}-${pageTo}`;
        } else if (pageFrom) {
            pageDesc = `Mulai dari Halaman ${pageFrom}`;
            pagesParam = `${pageFrom}-`;
        } else if (pageTo) {
            pageDesc = `Sampai Halaman ${pageTo}`;
            pagesParam = `-${pageTo}`;
        }

        const printDetails = `${colorOption}, ${pageDesc}`;

        const formData = new FormData();
        for (const file of fileInput.files) {
            formData.append("file", file);
        }

        try {
            // Upload files first
            const uploadRes = await fetch(`${BASE_URL}/uploadFile`, { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            console.log('Uploaded files:', uploadData);

            // For each uploaded file, simulate printing
            for (const uploadedFile of (Array.isArray(uploadData.files) ? uploadData.files : [uploadData])) {
                addToQueue(uploadedFile.filename, printDetails);

                // Call the print endpoint
                const printRes = await fetch(
                    `${BASE_URL}/printFile?filename=${encodeURIComponent(uploadedFile.filename)}&color=${colorOption==='Warna'}&pages=${encodeURIComponent(pagesParam)}`,
                    { method: 'POST' }
                );
                const printData = await printRes.json();
                console.log('Print response:', printData);
            }

            alert(`${fileInput.files.length} file PDF telah dikirim ke printer (simulasi).`);

        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat upload/printing');
        }
    });
}
initializeQueue();
// ========================================================
// BAGIAN 2: LOGIKA UNTUK FITUR MERGE PDF INTERAKTIF (DENGAN BACKEND)
// ========================================================
const mergeCard = document.getElementById('merge-pdf');
if (mergeCard) {
    const fileInput = document.getElementById('pdf-merge-input');
    const fileList = document.getElementById('merge-file-list');
    const dropArea = document.getElementById('merge-drop-area');
    const selectBtn = document.getElementById('select-files-btn');
    const mergeBtn = document.getElementById('merge-btn');
    const downloadArea = document.getElementById('download-area');
    const addMoreBtn = document.getElementById('add-more-files-btn');
    const sortBtn = document.getElementById('sort-files-btn');

    let files = [];
    let sortAsc = true;

    // ========== FILE MANAGEMENT ==========

    const renderFileList = () => {
        fileList.innerHTML = '';
        files.forEach((file, idx) => {
            const li = document.createElement('li');
            li.className = 'merge-file-item';
            li.draggable = true;
            li.dataset.index = idx;
            li.innerHTML = `
                <span>${file.name}</span>
                <button class="remove-file-btn" data-index="${idx}">&times;</button>
            `;
            fileList.appendChild(li);
        });
        mergeBtn.disabled = files.length < 2;
    };

    const handleFiles = (newFiles) => {
        for (let f of newFiles) {
            if (f.type === 'application/pdf') {
                files.push(f);
            }
        }
        renderFileList();
    };

    // ========== FILE INPUT / DROP ==========

    selectBtn.addEventListener('click', () => fileInput.click());
    addMoreBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // ========== FILE REMOVE ==========

    fileList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-file-btn')) {
            const idx = parseInt(e.target.dataset.index);
            files.splice(idx, 1);
            renderFileList();
        }
    });

    // ========== SORT FILES ==========

    sortBtn.addEventListener('click', () => {
        sortAsc = !sortAsc;
        sortBtn.textContent = sortAsc ? 'A-Z ↓' : 'Z-A ↑';
        files.sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
        renderFileList();
    });

    // ========== MERGE FILES (POST /merge) ==========

    mergeBtn.addEventListener('click', async () => {
        if (files.length < 2) {
            alert('Tambahkan minimal 2 file PDF untuk digabungkan.');
            return;
        }

        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Menggabungkan...';
        downloadArea.innerHTML = '';

        try {
            const uploadedFiles = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch(`${BASE_URL}/uploadFile`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Gagal mengunggah');
                const uploadData = await uploadRes.json();
                uploadedFiles.push(uploadData.filename);
            }

            const res = await fetch(`${BASE_URL}/mergeFile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: uploadedFiles })
            });

            if (!res.ok) throw new Error('Gagal menggabungkan');
            const data = await res.json();

            const link = document.createElement('a');
            link.href = `${BASE_URL}${data.download_url}`;
            link.download = 'merged.pdf';
            link.textContent = 'Unduh hasil gabungan';
            downloadArea.appendChild(link);

        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan: ' + err.message);
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Gabungkan PDF';
        }
    });
    renderFileList();
}
// ========================================================
// BAGIAN 3: LOGIKA UNTUK FITUR SPLIT PDF DINAMIS
// ========================================================
const splitCard = document.getElementById('split-pdf');
if (splitCard) {
    const splitFileInput = document.getElementById('pdf-split');
    const rangesContainer = document.getElementById('split-ranges-container');
    const addRangeBtn = document.getElementById('add-range-btn');
    const splitButton = document.getElementById('split-btn');
    const splitDownloadArea = document.getElementById('split-download-area');
    const pdfInfo = document.getElementById('pdf-info');
    let pdfTotalPages = 0;

    // -------------------------
    // Range management
    // -------------------------
    const renumberRanges = () => {
        const allRanges = rangesContainer.querySelectorAll('.range-block');
        allRanges.forEach((block, index) => {
            const header = block.querySelector('.range-header span');
            header.textContent = `Rentang ${index + 1}`;
        });
    };

    const updateAllMaxPages = (maxPage) => {
        const allPageInputs = rangesContainer.querySelectorAll('.split-range-from, .split-range-to');
        allPageInputs.forEach(input => input.max = maxPage);
    };

    const createRangeBlock = () => {
        const newRangeNumber = rangesContainer.querySelectorAll('.range-block').length + 1;
        const block = document.createElement('div');
        block.className = 'range-block';
        block.innerHTML = `
            <div class="range-header">
                <span>Rentang ${newRangeNumber}</span>
                <button class="remove-range-btn" title="Hapus rentang">&times;</button>
            </div>
            <div class="range-inputs">
                <div class="range-input-group">
                    <label>dari halaman</label>
                    <input type="number" class="split-range-from" min="1" ${pdfTotalPages > 0 ? `max="${pdfTotalPages}"` : ''} placeholder="1">
                </div>
                <div class="range-input-group">
                    <label>ke</label>
                    <input type="number" class="split-range-to" min="1" ${pdfTotalPages > 0 ? `max="${pdfTotalPages}"` : ''} placeholder="${pdfTotalPages > 0 ? pdfTotalPages : '...'}">
                </div>
            </div>
        `;
        rangesContainer.appendChild(block);
        checkSplitButtonState();
    };

    const checkSplitButtonState = () => {
        const ranges = rangesContainer.querySelectorAll('.range-block');
        let allRangesValid = ranges.length > 0;
        ranges.forEach(range => {
            const from = range.querySelector('.split-range-from').value;
            const to = range.querySelector('.split-range-to').value;
            if (from === '' || to === '') allRangesValid = false;
        });
        splitButton.disabled = !(splitFileInput.files.length > 0 && allRangesValid);
    };

    addRangeBtn.addEventListener('click', createRangeBlock);
    rangesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-range-btn')) {
            e.target.closest('.range-block').remove();
            renumberRanges();
            checkSplitButtonState();
        }
    });
    rangesContainer.addEventListener('input', checkSplitButtonState);

    // -------------------------
    // PDF file input
    // -------------------------
    splitFileInput.addEventListener('change', (event) => {
        pdfInfo.textContent = '';
        pdfTotalPages = 0;
        updateAllMaxPages('');
        checkSplitButtonState();
        const file = event.target.files[0];
        if (!file) return;
        pdfInfo.textContent = 'Membaca file...';
        const reader = new FileReader();
        reader.onload = (e) => {
            const typedarray = new Uint8Array(e.target.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                pdfTotalPages = pdf.numPages;
                pdfInfo.textContent = `File: ${file.name} (${pdfTotalPages} halaman)`;
                updateAllMaxPages(pdfTotalPages);
            }).catch(err => {
                pdfInfo.textContent = 'Gagal membaca file PDF.';
                console.error(err);
            });
        };
        reader.readAsArrayBuffer(file);
    });

    // -------------------------
    // Split button
    // -------------------------
    splitButton.addEventListener('click', async () => {
        console.log("Split button clicked!");
        const file = splitFileInput.files[0];
        if (!file) return alert('Pilih file PDF terlebih dahulu.');

        // Prepare ranges string
        const rangeBlocks = rangesContainer.querySelectorAll('.range-block');
        const rangesArr = [];
        rangeBlocks.forEach(block => {
            const from = parseInt(block.querySelector('.split-range-from').value, 10);
            const to = parseInt(block.querySelector('.split-range-to').value, 10);
            if (isNaN(from) || isNaN(to) || from <= 0 || to <= 0 || from > to || to > pdfTotalPages) {
                throw new Error('Rentang halaman tidak valid.');
            }
            rangesArr.push(`${from}-${to}`);
        });
        const rangesStr = rangesArr.join(',');

        try {
            // Upload file
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            const uploadRes = await fetch(`${BASE_URL}/uploadFile`, { method: 'POST', body: uploadFormData });
            const uploadData = await uploadRes.json();
            console.log('Upload response:', uploadData);

            // Split request
            const splitRes = await fetch(`${BASE_URL}/splitFile?filename=${encodeURIComponent(uploadData.filename)}&ranges=${encodeURIComponent(rangesStr)}`, {
                method: 'POST'
            });
            const splitData = await splitRes.json();
            console.log('Split response:', splitData);

            // Build download links
            splitDownloadArea.innerHTML = '';
            splitData.split_files.forEach((fname, idx) => {
                const link = document.createElement('a');
                link.href = `${BASE_URL}${splitData.download_urls[idx]}`;
                link.download = fname;
                link.textContent = `Unduh ${fname}`;
                splitDownloadArea.appendChild(link);
                splitDownloadArea.appendChild(document.createElement('br'));
            });

            alert('File PDF berhasil di-split! Klik link untuk mengunduh.');
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memproses split PDF.');
        }
    });

    createRangeBlock();
}
});