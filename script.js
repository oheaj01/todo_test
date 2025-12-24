// 할일 데이터를 저장할 배열
let todos = [];

// Firebase 초기화
const firebaseConfig = {
    apiKey: "AIzaSyAfWlQkwnQOAtV-TaykZByLaYEptq2rP3c",
    authDomain: "todo-f0893.firebaseapp.com",
    databaseURL: "https://todo-f0893-default-rtdb.firebaseio.com",
    projectId: "todo-f0893",
    storageBucket: "todo-f0893.firebasestorage.app",
    messagingSenderId: "507392242924",
    appId: "1:507392242924:web:2e3fb146b6eb8655b3e1c9",
    measurementId: "G-51Z98J52HD"
};

// Firebase 앱 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const todosRef = database.ref('todos');


// 뷰 모드 상태 ('list' 또는 'calendar')
let currentView = 'list';
let allTodosFilter = 'all';

// 현재 달력 표시 월
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// DOM 요소들
const addTodoBtn = document.getElementById('addTodoBtn');
const modal = document.getElementById('todoModal');
const detailModal = document.getElementById('detailModal');
const closeBtn = document.querySelector('.close');
const detailCloseBtn = document.querySelector('.detail-close');
const cancelBtn = document.getElementById('cancelBtn');
const detailCancelBtn = document.getElementById('detailCancelBtn');
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const calendarView = document.getElementById('calendarView');
const todayTodosSection = document.getElementById('todayTodosSection');
const listViewBtn = document.getElementById('listViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const dateTodosModal = document.getElementById('dateTodosModal');
const dateTodosModalTitle = document.getElementById('dateTodosModalTitle');
const dateTodosContent = document.getElementById('dateTodosContent');
const dateTodosCloseBtn = document.querySelector('.date-todos-close');
const dateAddModal = document.getElementById('dateAddModal');
const dateAddCloseBtn = document.querySelector('.date-add-close');
const dateAddForm = document.getElementById('dateAddForm');
const dateAddCancelBtn = document.getElementById('dateAddCancelBtn');
const dateAddSelectedDate = document.getElementById('dateAddSelectedDate');
const dateAddTitleInput = document.getElementById('dateAddTitle');
const dateAddDescriptionInput = document.getElementById('dateAddDescription');

let currentDateTodosDate = null;
let currentDateAddDate = null;

// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜를 한국어 형식으로 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

// 오늘 날짜인지 확인
function isToday(dateString) {
    return dateString === getTodayDate();
}

// 모달 열기
function openModal() {
    modal.classList.add('show');
    // 오늘 날짜를 기본값으로 설정
    document.getElementById('todoDate').value = getTodayDate();
}

// 모달 닫기
function closeModal() {
    modal.classList.remove('show');
    todoForm.reset();
}

// 할일 추가
function addTodo(title, description, date) {
    const todo = {
        id: Date.now(), // 고유 ID 생성
        title: title,
        description: description,
        date: date,
        completed: false
    };
    todos.push(todo);
    saveTodos();
    renderTodayTodos();
    if (currentView === 'list') {
        renderAllTodos();
    } else {
        renderCalendar();
    }
    closeModal();
}

// 할일 완료 처리
function completeTodo(id) {
    const todo = todos.find(t => String(t.id) === String(id));
    if (todo) {
        const newStatus = !todo.completed;
        // Firebase에서 직접 업데이트
        todosRef.child(String(id)).update({
            completed: newStatus
        }).catch(error => {
            console.error('Firebase 업데이트 오류:', error);
        });
    }
}

// 할일 삭제 처리
function deleteTodo(id) {
    if (confirm('정말 이 할일을 삭제하시겠습니까?')) {
        // Firebase에서 직접 삭제 (ID를 문자열로 변환)
        todosRef.child(String(id)).remove()
            .then(() => {
                console.log('할일이 삭제되었습니다.');
            })
            .catch(error => {
                console.error('Firebase 삭제 오류:', error);
            });
    }
}

// 현재 보고 있는 할일 ID 저장
let currentDetailTodoId = null;

// 상세 정보 모달 열기
function openDetailModal(todo) {
    currentDetailTodoId = todo.id;
    document.getElementById('detailTitle').textContent = todo.title;
    document.getElementById('detailDescription').textContent = todo.description;
    document.getElementById('detailDate').textContent = formatDate(todo.date);

    // 완료/미완료 전환 버튼 텍스트 업데이트
    const toggleBtn = document.getElementById('toggleCompleteBtn');
    toggleBtn.textContent = todo.completed ? '미완료로 전환' : '완료로 전환';

    // 읽기 모드로 전환
    document.getElementById('detailViewMode').style.display = 'block';
    document.getElementById('editTodoForm').style.display = 'none';

    detailModal.classList.add('show');
}

// 상세 정보 모달 닫기
function closeDetailModal() {
    detailModal.classList.remove('show');
    currentDetailTodoId = null;
    // 편집 모드에서 읽기 모드로 복귀
    document.getElementById('detailViewMode').style.display = 'block';
    document.getElementById('editTodoForm').style.display = 'none';
}

// 날짜별 할일 목록 모달 열기
function openDateTodosModal(dateStr) {
    currentDateTodosDate = dateStr;
    const dayTodos = todos.filter(todo => todo.date === dateStr);
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    dateTodosModalTitle.textContent = `${year}년 ${month}월 ${day}일 (${weekday}) 할 일 목록`;

    const todosMarkup = dayTodos.length > 0
        ? `
            <div class="date-todos-list">
                ${dayTodos.map(todo => `
                    <div class="date-todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                        <div class="date-todo-header">
                            <div class="date-todo-title">${escapeHtml(todo.title)}</div>
                            <div class="date-todo-actions">
                                <button class="todo-action-btn complete-btn date-todo-complete" data-id="${todo.id}">
                                    ${todo.completed ? '미완료로 전환' : '완료'}
                                </button>
                                <button class="todo-action-btn delete-btn date-todo-delete" data-id="${todo.id}">
                                    삭제
                                </button>
                            </div>
                        </div>
                        <div class="date-todo-description">${escapeHtml(todo.description)}</div>
                    </div>
                `).join('')}
            </div>
        `
        : `
            <div class="empty-state">
                <p>📝</p>
                <p>이 날짜에는 할일이 없습니다.</p>
            </div>
        `;

    dateTodosContent.innerHTML = `
        ${todosMarkup}
        <div class="date-add-action">
            <button class="submit-btn date-add-btn">이 날짜에 새 할일 추가</button>
        </div>
    `;

    if (dayTodos.length > 0) {
        document.querySelectorAll('.date-todo-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id; // Keep as string for Firebase
                completeTodo(id);
            });
        });

        document.querySelectorAll('.date-todo-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id; // Keep as string for Firebase
                deleteTodo(id);
            });
        });
    }

    const addBtn = dateTodosContent.querySelector('.date-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openDateAddModal(dateStr);
        });
    }

    dateTodosModal.classList.add('show');
}

// 날짜별 할일 목록 모달 닫기
function closeDateTodosModal() {
    dateTodosModal.classList.remove('show');
    currentDateTodosDate = null;
}

// 날짜별 새 할일 추가 모달 열기
function openDateAddModal(dateStr) {
    currentDateAddDate = dateStr;
    dateAddSelectedDate.textContent = formatDate(dateStr);
    dateAddTitleInput.value = '';
    dateAddDescriptionInput.value = '';
    dateAddModal.classList.add('show');
}

// 날짜별 새 할일 추가 모달 닫기
function closeDateAddModal() {
    dateAddModal.classList.remove('show');
    currentDateAddDate = null;
}

// 편집 모드로 전환
function enterEditMode() {
    const todo = todos.find(t => t.id === currentDetailTodoId);
    if (!todo) return;

    // 편집 폼에 현재 값 채우기
    document.getElementById('editTitle').value = todo.title;
    document.getElementById('editDescription').value = todo.description;
    document.getElementById('editDate').value = todo.date;

    // 모드 전환
    document.getElementById('detailViewMode').style.display = 'none';
    document.getElementById('editTodoForm').style.display = 'block';
}

// 편집 취소
function cancelEdit() {
    document.getElementById('detailViewMode').style.display = 'block';
    document.getElementById('editTodoForm').style.display = 'none';
    // 현재 할일 정보로 다시 업데이트
    const todo = todos.find(t => t.id === currentDetailTodoId);
    if (todo) {
        openDetailModal(todo);
    }
}

// 할일 수정 저장
function saveEditTodo(title, description, date) {
    const todo = todos.find(t => t.id === currentDetailTodoId);
    if (todo) {
        todo.title = title;
        todo.description = description;
        todo.date = date;
        saveTodos();
        renderTodayTodos();
        if (currentView === 'list') {
            renderAllTodos();
        } else {
            renderCalendar();
        }
        if (dateTodosModal.classList.contains('show') && currentDateTodosDate) {
            openDateTodosModal(currentDateTodosDate);
        }
        // 수정된 정보로 상세 모달 업데이트
        openDetailModal(todo);
    }
}

// 완료/미완료 전환 (상세 모달에서)
function toggleCompleteFromDetail() {
    if (currentDetailTodoId !== null) {
        completeTodo(currentDetailTodoId);
        // 업데이트된 할일 정보로 모달 새로고침
        const todo = todos.find(t => t.id === currentDetailTodoId);
        if (todo) {
            openDetailModal(todo);
        }
    }
}

// 할일 항목 HTML 생성
function createTodoItemHTML(todo) {
    const isTodayTodo = isToday(todo.date);
    const completedClass = todo.completed ? 'completed' : '';
    return `
        <div class="todo-item ${isTodayTodo ? 'today' : ''} ${completedClass}" data-id="${todo.id}">
            <div class="todo-header">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                <div class="todo-date">${formatDate(todo.date)}</div>
            </div>
            <div class="todo-content">
                <div class="todo-description">${escapeHtml(todo.description)}</div>
                <div class="todo-actions" onclick="event.stopPropagation()">
                    <button class="todo-action-btn complete-btn" data-id="${todo.id}">
                        ${todo.completed ? '완료 취소' : '완료'}
                    </button>
                    <button class="todo-action-btn delete-btn" data-id="${todo.id}">삭제</button>
                </div>
            </div>
        </div>
    `;
}

// 오늘의 할일 섹션 렌더링
function renderTodayTodos() {
    const todayTodos = todos.filter(todo => isToday(todo.date));

    if (todayTodos.length > 0) {
        todayTodosSection.innerHTML = `
            <h2 class="section-title">오늘의 할일</h2>
            <div class="section-todos">
                ${todayTodos.map(todo => createTodoItemHTML(todo)).join('')}
            </div>
        `;
    } else {
        todayTodosSection.innerHTML = '';
    }

} else {
    todayTodosSection.innerHTML = '';
}
}

// 뷰 모드 전환
function switchView(view) {
    currentView = view;

    if (view === 'list') {
        todoList.style.display = 'block';
        calendarView.style.display = 'none';
        listViewBtn.classList.add('active');
        calendarViewBtn.classList.remove('active');
        renderAllTodos();
    } else {
        todoList.style.display = 'none';
        calendarView.style.display = 'block';
        listViewBtn.classList.remove('active');
        calendarViewBtn.classList.add('active');
        renderCalendar();
    }
}

// 모든 할일 목록 렌더링 (목록 뷰용)
function renderAllTodos() {
    // 모든 할일을 날짜순으로 정렬 (가장 빠른 일자부터)
    let allTodos = [...todos].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    if (allTodosFilter === 'completed') {
        allTodos = allTodos.filter(todo => todo.completed);
    } else if (allTodosFilter === 'pending') {
        allTodos = allTodos.filter(todo => !todo.completed);
    }

    let html = '';

    // 모든 할일 섹션
    html += `
        <div class="todo-section">
            <div class="section-header">
                <h2 class="section-title">모든 할일</h2>
                <div class="todos-filter">
                    <button class="todos-filter-btn ${allTodosFilter === 'all' ? 'active' : ''}" data-filter="all">전체</button>
                    <button class="todos-filter-btn ${allTodosFilter === 'completed' ? 'active' : ''}" data-filter="completed">완료</button>
                    <button class="todos-filter-btn ${allTodosFilter === 'pending' ? 'active' : ''}" data-filter="pending">미완료</button>
                </div>
            </div>
            <div class="section-todos">
                ${allTodos.length > 0
            ? allTodos.map(todo => createTodoItemHTML(todo)).join('')
            : '<div class="empty-state"><p>할일이 없습니다.</p></div>'
        }
            </div>
        </div>
    `;

    todoList.innerHTML = html;

    document.querySelectorAll('.todos-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            if (filter && filter !== allTodosFilter) {
                allTodosFilter = filter;
                renderAllTodos();
            }
        });
    });

    document.querySelectorAll('.todos-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            if (filter && filter !== allTodosFilter) {
                allTodosFilter = filter;
                renderAllTodos();
            }
        });
    });
}

// 할일 항목 이벤트 위임 (컨테이너에 한 번만 연결)
function setupTodoItemEvents() {
    const handleTodoClick = (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        const todoId = item.dataset.id;

        // 삭제 버튼 클릭
        if (e.target.closest('.delete-btn')) {
            e.stopPropagation();
            deleteTodo(todoId);
            return;
        }

        // 완료 버튼 클릭
        if (e.target.closest('.complete-btn')) {
            e.stopPropagation();
            completeTodo(todoId);
            return;
        }

        // 항목 클릭 (상세 모달)
        if (!e.target.closest('.todo-actions')) {
            const todo = todos.find(t => String(t.id) === String(todoId));
            if (todo) {
                openDetailModal(todo);
            }
        }
    };

    todayTodosSection.addEventListener('click', handleTodoClick);
    todoList.addEventListener('click', handleTodoClick);
}

// 달력 렌더링
function renderCalendar() {
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    let html = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" id="prevMonthBtn">‹</button>
            <h2 class="calendar-title">${currentCalendarYear}년 ${monthNames[currentCalendarMonth]}</h2>
            <button class="calendar-nav-btn" id="nextMonthBtn">›</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekdays">
                ${dayNames.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
            </div>
            <div class="calendar-days">
    `;

    // 빈 칸 추가 (첫 번째 날짜 전)
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // 날짜 칸 추가
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTodos = todos.filter(todo => todo.date === dateStr);
        const isTodayDate = dateStr === getTodayDate();

        html += `
            <div class="calendar-day ${isTodayDate ? 'today' : ''}" data-date="${dateStr}">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-todos">
                    ${dayTodos.map(todo => `
                        <div class="calendar-todo-item ${todo.completed ? 'completed' : ''}">
                            ${escapeHtml(todo.title)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    calendarView.innerHTML = html;

    // 이벤트 리스너 추가
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        if (currentCalendarMonth === 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        } else {
            currentCalendarMonth--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        if (currentCalendarMonth === 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        } else {
            currentCalendarMonth++;
        }
        renderCalendar();
    });

    // 달력의 날짜 클릭 이벤트
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayElement => {
        dayElement.addEventListener('click', (e) => {
            const dateStr = dayElement.dataset.date;
            if (dateStr) {
                openDateTodosModal(dateStr);
            }
        });
    });
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Firebase에 저장
function saveTodos() {
    // todos 배열을 객체로 변환하여 Firebase에 저장
    const todosObject = {};
    todos.forEach(todo => {
        todosObject[todo.id] = {
            title: todo.title,
            description: todo.description,
            date: todo.date,
            completed: todo.completed
        };
    });
    todosRef.set(todosObject).catch(error => {
        console.error('Firebase 저장 오류:', error);
    });
}

// 샘플 데이터 추가
function addSampleTodos() {
    const sampleTodos = [
        {
            id: Date.now() + 1,
            title: '프로젝트 마감 준비',
            description: '2025년 11월 프로젝트 최종 보고서 작성 및 발표 자료 준비',
            date: '2025-11-28',
            completed: false
        },
        {
            id: Date.now() + 2,
            title: '연말 회의 준비',
            description: '12월 초 팀 회의를 위한 자료 정리 및 안건 검토',
            date: '2025-12-03',
            completed: false
        },
        {
            id: Date.now() + 3,
            title: '연말 정산 작업',
            description: '2025년 연말 정산 관련 서류 준비 및 제출',
            date: '2025-11-30',
            completed: false
        },
        {
            id: Date.now() + 4,
            title: '새해 계획 수립',
            description: '2026년 목표 설정 및 계획서 작성',
            date: '2025-12-05',
            completed: false
        },
        {
            id: Date.now() + 5,
            title: '연말 파티 준비',
            description: '회사 연말 파티 준비 및 참석자 명단 확인',
            date: '2025-12-10',
            completed: false
        },
        {
            id: Date.now() + 6,
            title: '연말 보고서 작성',
            description: '2025년 연간 업무 보고서 작성 및 제출',
            date: '2025-12-15',
            completed: false
        }
    ];

    // 기존 할일과 중복되지 않도록 추가
    const existingIds = todos.map(t => t.id);
    sampleTodos.forEach(todo => {
        if (!existingIds.includes(todo.id)) {
            todos.push(todo);
        }
    });

    saveTodos();
}

// Firebase에서 불러오기
function loadTodos() {
    // Firebase에서 실시간으로 데이터 로드
    todosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Firebase 객체를 배열로 변환
            todos = Object.keys(data).map(id => ({
                id: parseInt(id),
                title: data[id].title,
                description: data[id].description,
                date: data[id].date,
                completed: data[id].completed
            }));
        } else {
            todos = [];
        }
        // UI 업데이트
        renderTodayTodos();
        if (currentView === 'list') {
            renderAllTodos();
        } else {
            renderCalendar();
        }
    }, (error) => {
        console.error('Firebase 로드 오류:', error);
    });
}

// 이벤트 리스너
addTodoBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
detailCloseBtn.addEventListener('click', closeDetailModal);
detailCancelBtn.addEventListener('click', closeDetailModal);
dateTodosCloseBtn.addEventListener('click', closeDateTodosModal);
dateAddCloseBtn.addEventListener('click', closeDateAddModal);
dateAddCancelBtn.addEventListener('click', closeDateAddModal);

// 뷰 모드 전환 버튼
listViewBtn.addEventListener('click', () => switchView('list'));
calendarViewBtn.addEventListener('click', () => switchView('calendar'));

// 편집 관련 이벤트 리스너
const editTodoBtn = document.getElementById('editTodoBtn');
const toggleCompleteBtn = document.getElementById('toggleCompleteBtn');
const editTodoForm = document.getElementById('editTodoForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

editTodoBtn.addEventListener('click', enterEditMode);
toggleCompleteBtn.addEventListener('click', toggleCompleteFromDetail);
cancelEditBtn.addEventListener('click', cancelEdit);

// 편집 폼 제출 처리
editTodoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const date = document.getElementById('editDate').value;

    if (title && description && date) {
        saveEditTodo(title, description, date);
    }
});

// 날짜별 새 할일 추가 폼 제출 처리
dateAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = dateAddTitleInput.value.trim();
    const description = dateAddDescriptionInput.value.trim();
    const date = currentDateAddDate;

    if (title && description && date) {
        addTodo(title, description, date);
        closeDateAddModal();
        if (currentDateTodosDate) {
            openDateTodosModal(currentDateTodosDate);
        }
    }
});

// 모달 외부 클릭 시 닫기
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
        closeDetailModal();
    }
});

dateTodosModal.addEventListener('click', (e) => {
    if (e.target === dateTodosModal) {
        closeDateTodosModal();
    }
});

dateAddModal.addEventListener('click', (e) => {
    if (e.target === dateAddModal) {
        closeDateAddModal();
    }
});

// 폼 제출 처리
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    const date = document.getElementById('todoDate').value;

    if (title && description && date) {
        addTodo(title, description, date);
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
            closeModal();
        }
        if (detailModal.classList.contains('show')) {
            closeDetailModal();
        }
        if (dateTodosModal.classList.contains('show')) {
            closeDateTodosModal();
        }
        if (dateAddModal.classList.contains('show')) {
            closeDateAddModal();
        }
    }
});

// 초기화
// 초기화
setupTodoItemEvents();
loadTodos();


