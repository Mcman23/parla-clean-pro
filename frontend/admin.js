// Mobil menyu
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// Səhifə keçidi
const navLinks = document.querySelectorAll('.nav-menu a');
const pages = document.querySelectorAll('.page');
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const target = link.dataset.page;
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        sidebar.classList.remove('open');
    });
});

// Gəlir qrafiki
new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: {
        labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
        datasets: [{
            label: 'Aylıq gəlir (₼)',
            data: [9,11,10,13,12,15,14,16,17,18,19,21],
            borderColor: '#1ca9c9', backgroundColor:'rgba(28,169,201,.1)',
            fill:true, tension:.4, borderWidth:3, pointRadius:0
        }]
    },
    options:{plugins:{legend:{display:false}}}
});

// Xidmət bölgüsü (Doughnut)
new Chart(document.getElementById('serviceChart'), {
    type: 'doughnut',
    data: {
        labels:['Ev','Ofis','Pəncərə','Dezinfeksiya','Tikinti'],
        datasets:[{data:[42,28,15,10,5],backgroundColor:['#1ca9c9','#3498db','#e67e22','#9b59b6','#2ecc71']}]
    },
    options:{cutout:'65%',plugins:{legend:{position:'bottom'}}}
});

// Maliyyə qrafiki
new Chart(document.getElementById('financeChart'), {
    type:'bar',
    data:{
        labels:['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
        datasets:[
            {label:'Gəlir',data:[9,11,10,13,12,15,14,16,17,18,19,21],backgroundColor:'#1ca9c9'},
            {label:'Xərc',data:[4,5,4,6,5,7,6,8,8,9,10,11],backgroundColor:'#e67e22'}
        ]
    },
    options:{plugins:{legend:{position:'bottom'}}}
});
