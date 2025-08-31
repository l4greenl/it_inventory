# backend/app.py
import os
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from datetime import date, datetime
from datetime import date as dt_date
import io
import qrcode
import base64
from sqlalchemy.exc import IntegrityError

# === Импорты моделей ===
from models import db, User, Asset, Type, Department, Status, Employee, Change, Property, Need

# Инициализация приложения
app = Flask(__name__)
# === Загрузка конфигурации ===
app.config.from_object('config.Config')

# === Инициализация расширений ===
db.init_app(app)
migrate = Migrate(app, db)

# === Настройка CORS ===
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})

# === Настройка Flask-Login ===
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# === Вспомогательная функция для преобразования ID в читаемые значения ===
def get_display_value(field, value):
    """Преобразует ID в человеко-читаемое значение для отображения в логах"""
    if value is None or value == '':
        return '-'

    if field in ['category_id', 'type_id']:
        try:
            type_id = int(value)
            # Используем Type, так как category_id было переименовано
            type_obj = Type.query.get(type_id)
            return type_obj.name if type_obj else f"Тип #{type_id}"
        except (ValueError, TypeError):
            return str(value)

    elif field == 'department_id':
        try:
            dept_id = int(value)
            dept = Department.query.get(dept_id)
            return dept.name if dept else f"Отдел #{dept_id}"
        except (ValueError, TypeError):
            return str(value)

    elif field == 'status_id':
        try:
            stat_id = int(value)
            stat = Status.query.get(stat_id)
            return stat.name if stat else f"Статус #{stat_id}"
        except (ValueError, TypeError):
            return str(value)

    elif field == 'responsible_person':
        try:
            emp_id = int(value)
            emp = Employee.query.get(emp_id)
            return emp.name if emp else f"Сотрудник #{emp_id}"
        except (ValueError, TypeError):
            return str(value)

    else:
        return str(value)

# === Маршруты API ===

# --- Пользователи ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Нет данных для входа'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Логин и пароль обязательны'}), 400

    user = User.query.filter_by(username=username).first()

    # Проверка НЕ хэшированного пароля (как в оригинале)
    if user and user.password_hash == password:
        login_user(user)
        return jsonify({
            'message': 'Вход выполнен успешно',
            'username': user.username,
            'role': user.role
        }), 200

    return jsonify({'error': 'Неверный логин или пароль'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Выход выполнен'}), 200

@app.route('/api/me')
def me():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'username': current_user.username,
            'role': current_user.role
        })
    return jsonify({'authenticated': False}), 401

# --- Активы ---
@app.route('/api/assets', methods=['GET'])
def get_assets():
    search = request.args.get('search', '')
    sort_by = request.args.get('sort', 'id')
    order = request.args.get('order', 'asc')

    query = Asset.query

    if search:
        query = query.filter(
            db.or_(
                Asset.inventory_number.contains(search),
                Asset.serial_number.contains(search)
            )
        )

    if hasattr(Asset, sort_by):
        sort_column = getattr(Asset, sort_by)
        if order == 'desc':
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)

    assets = query.all()
    return jsonify([asset.to_dict() for asset in assets])

@app.route('/api/assets/<int:id>', methods=['GET'])
def get_asset(id):
    asset = Asset.query.get_or_404(id)
    return jsonify(asset.to_dict())

@app.route('/api/assets', methods=['POST'])
@login_required
def create_asset():
    """Создает новый актив."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Нет данных для создания актива'}), 400

    # --- Проверка обязательных полей ---
    required_fields = ['inventory_number', 'type_id', 'status_id']
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({'error': 'Отсутствуют обязательные поля', 'missing': missing}), 400
    # --- Конец проверки обязательных полей ---

    try:
        # --- Функция для безопасного получения целочисленного значения ---
        def get_int_or_none(key):
            value = data.get(key)
            if value is None or value == '':
                return None
            try:
                return int(value)
            except (ValueError, TypeError):
                app.logger.warning(f"Невозможно преобразовать значение '{value}' для поля '{key}' в integer. Установлено в None.")
                return None
        # --- Конец функции ---

        # --- Обработка даты ---
        purchase_date_value = None
        if data.get('purchase_date'):
            try:
                purchase_date_value = date.fromisoformat(data['purchase_date'])
            except ValueError:
                app.logger.warning(f"Неверный формат даты: {data['purchase_date']}")
        # --- Конец обработки даты ---

        # --- Создание объекта актива ---
        new_asset = Asset(
            serial_number=data.get('serial_number'),
            inventory_number=data.get('inventory_number'),
            brand=data.get('brand'),
            model=data.get('model'),
            type_id=get_int_or_none('type_id'),
            department_id=get_int_or_none('department_id'),
            room=data.get('room'),
            purchase_date=purchase_date_value,
            responsible_person=get_int_or_none('responsible_person'),
            actual_user=get_int_or_none('actual_user'), # Используем get_int_or_none
            comments=data.get('comments'),
            status_id=get_int_or_none('status_id'),
            diagonal=data.get('diagonal'), # Предполагается, что это VARCHAR/TEXT
            CPU=data.get('CPU'),          # Предполагается, что это VARCHAR/TEXT
            RAM=data.get('RAM'),          # Предполагается, что это VARCHAR/TEXT
            Drive=data.get('Drive'),      # Предполагается, что это VARCHAR/TEXT
            OS=data.get('OS'),            # Предполагается, что это VARCHAR/TEXT
            IP_address=data.get('IP_address'), # Предполагается, что это VARCHAR/TEXT
            number=data.get('number')     # Предполагается, что это VARCHAR/TEXT или INTEGER (если INTEGER, используйте get_int_or_none)
            # Добавьте другие динамические поля, если они есть в модели и отправляются
        )
        db.session.add(new_asset)
        db.session.flush() # Получаем new_asset.id
        # --- Конец создания объекта ---

        # --- Формирование имени актива для лога ---
        # Используем db.session.get для SQLAlchemy 2.x (устраняет LegacyAPIWarning)
        asset_type_obj = db.session.get(Type, new_asset.type_id) if new_asset.type_id else None
        type_name = asset_type_obj.name if asset_type_obj else "Без типа"
        asset_name = f"{type_name} {new_asset.brand} {new_asset.model}".strip()
        # --- Конец формирования имени ---

        # --- Логирование создания ---
        change = Change(
            asset_id=new_asset.id,
            inventory_number=new_asset.inventory_number,
            asset_name=asset_name,
            action='created',
            field='created',
            old_value='',
            new_value='Актив создан'
        )
        db.session.add(change)
        # --- Конец логирования ---

        db.session.commit()
        return jsonify(new_asset.to_dict()), 201

    except ValueError as ve:
        db.session.rollback()
        app.logger.error(f"Ошибка преобразования данных при создании актива: {ve}")
        return jsonify({'error': 'Неверный формат данных (например, даты или ID)', 'details': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при создании актива: {e}")
        return jsonify({'error': 'Не удалось создать актив', 'details': str(e)}), 500

@app.route('/api/assets/<int:id>', methods=['PUT'])
@login_required
def update_asset(id):
    # 1. Получение и проверка данных
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Нет данных для обновления'}), 400

    # 2. Получение актива
    asset = db.session.get(Asset, id)
    if not asset:
        return jsonify({'error': 'Актив не найден'}), 404

    # 3. Подготовка old_values (исходные значения)
    old_values = {
        'serial_number': asset.serial_number,
        'inventory_number': asset.inventory_number,
        'brand': asset.brand,
        'model': asset.model,
        'type_id': asset.type_id,
        'department_id': asset.department_id,
        'room': asset.room,
        'purchase_date': asset.purchase_date,
        'responsible_person': asset.responsible_person,
        'actual_user': asset.actual_user,
        'comments': asset.comments,
        'status_id': asset.status_id,
        'diagonal': asset.diagonal,
        'CPU': asset.CPU,
        'RAM': asset.RAM,
        'Drive': asset.Drive,
        'OS': asset.OS,
        'IP_address': asset.IP_address,
        'number': asset.number,
    }

    # --- НОВАЯ ЛОГИКА ОБНОВЛЕНИЯ ---
    # 4. Обновление полей актива НЕПОСРЕДСТВЕННО из data
    # Это простой и прямолинейный способ: если ключ есть в data и в списке разрешенных полей, обновляем.
    allowed_fields = set(old_values.keys()) # Множество для быстрого поиска
    fields_to_update = {} # Словарь для сбора изменений
    
    for key, new_value in data.items():
        if key in allowed_fields:
            old_value = old_values.get(key)
            # Преобразуем даты для корректного сравнения, если нужно
            if key == 'purchase_date':
                 try:
                     old_date_obj = date.fromisoformat(str(old_value)) if old_value else None
                 except (ValueError, TypeError):
                     old_date_obj = old_value
                 try:
                     new_date_obj = date.fromisoformat(str(new_value)) if new_value else None
                 except (ValueError, TypeError):
                     new_date_obj = new_value
                 
                 # Сравниваем преобразованные даты или оригинальные значения
                 if old_date_obj != new_date_obj:
                     fields_to_update[key] = new_value
                     setattr(asset, key, new_value)
            else:
                # Для остальных полей простое сравнение
                if old_value != new_value:
                    fields_to_update[key] = new_value
                    setattr(asset, key, new_value)
    # --- КОНЕЦ НОВОЙ ЛОГИКИ ОБНОВЛЕНИЯ ---

    if fields_to_update: # Только если были изменения
        try:
            def log_single_change(field, old_val, new_val):
                 # Используем старую логику сравнения из предыдущих версий, если она работала
                 # или оставляем простое сравнение, так как мы уже проверили выше
                 
                 display_old = get_display_value(field, old_val)
                 display_new = get_display_value(field, new_val)

                 # Формирование asset_name для лога (используем обновленные или старые данные)
                 # Приоритет: новые данные из data -> старые данные из asset (через old_values)
                 current_type_id = data.get('type_id', old_values.get('type_id'))
                 # ИСПРАВЛЕНО: LegacyAPIWarning
                 current_type = db.session.get(Type, current_type_id) if current_type_id else None
                 type_name = current_type.name if current_type else "Без типа"
                 brand = data.get('brand', old_values.get('brand')) or ""
                 model = data.get('model', old_values.get('model')) or ""
                 asset_name = f"{type_name} {brand} {model}".strip()
                 inventory_number = data.get('inventory_number', old_values.get('inventory_number'))

                 change = Change(
                     asset_id=asset.id,
                     inventory_number=inventory_number,
                     asset_name=asset_name,
                     action="updated",
                     field=field,
                     old_value=display_old,
                     new_value=display_new
                 )
                 db.session.add(change)
            # --- Конец функции логирования ---
            
            # Логируем каждое измененное поле
            for field_key, new_val in fields_to_update.items():
                log_single_change(field_key, old_values.get(field_key), new_val)

            # 6. Сохранение изменений в БД
            db.session.commit()
            # ИСПРАВЛЕНО: LegacyAPIWarning - получаем обновленный объект
            updated_asset = db.session.get(Asset, id)
            return jsonify(updated_asset.to_dict()), 200

        except IntegrityError as ie: # Обработка ошибок целостности БД
            db.session.rollback()
            app.logger.error(f"Ошибка целостности БД при обновлении актива {id}: {ie}")
            return jsonify({'error': 'Ошибка данных', 'details': 'Нарушены ограничения базы данных (например, обязательное поле не заполнено, или ссылка на несуществующий объект).'}), 400
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Ошибка при обновлении актива {id}: {e}")
            return jsonify({'error': 'Ошибка при сохранении', 'details': str(e)}), 500
    else:
        # Если изменений не было
        return jsonify(asset.to_dict()), 200

@app.route('/api/assets/<int:id>', methods=['DELETE'])
@login_required
def delete_asset(id):
    asset = Asset.query.get_or_404(id)
    
    try:
        asset_type_obj = db.session.get(Type, asset.type_id) # Используем db.session.get для SQLAlchemy 2.x
        # Получаем имя типа или задаем значение по умолчанию
        type_name = asset_type_obj.name if asset_type_obj else "Без типа"

        # Формируем имя актива для лога, используя type_name
        asset_name = f"{type_name} {asset.brand} {asset.model}".strip()
        
        change = Change(
            asset_id=asset.id,
            inventory_number=asset.inventory_number,
            asset_name=asset_name,
            action='deleted',
            field='deleted',
            old_value='Актив удален',
            new_value=''
        )
        db.session.add(change)
        
        db.session.delete(asset)
        db.session.commit()
        return jsonify({'message': 'Актив успешно удален'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при удалении актива {id}: {e}")
        return jsonify({'error': 'Не удалось удалить актив', 'details': str(e)}), 500

# --- История изменений ---
@app.route('/api/changes', methods=['GET'])
def get_changes():
    asset_id = request.args.get('asset_id', type=int)
    action = request.args.get('action')
    field = request.args.get('field')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Change.query

    if asset_id:
        query = query.filter(Change.asset_id == asset_id)
    if action:
        query = query.filter(Change.action == action)
    if field:
        query = query.filter(Change.field == field)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Change.changed_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(Change.changed_at <= end_dt)
        except ValueError:
            pass

    changes = query.order_by(Change.changed_at.desc()).all()
    return jsonify([change.to_dict() for change in changes])

# --- Типы устройств ---
@app.route('/api/types', methods=['GET'])
def get_types():
    types = Type.query.all()
    return jsonify([t.to_dict() for t in types])

@app.route('/api/types', methods=['POST'])
@login_required
def create_type():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название типа обязательно'}), 400
    try:
        new_type = Type(name=data['name'])
        db.session.add(new_type)
        db.session.commit()
        return jsonify(new_type.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось создать тип', 'details': str(e)}), 500

@app.route('/api/types/<int:id>', methods=['PUT'])
@login_required
def update_type(id):
    type_obj = Type.query.get_or_404(id)
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название типа обязательно'}), 400
    try:
        type_obj.name = data['name']
        db.session.commit()
        return jsonify(type_obj.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось обновить тип', 'details': str(e)}), 500

@app.route('/api/types/<int:id>', methods=['DELETE'])
@login_required
def delete_type(id):
    type_obj = Type.query.get_or_404(id)
    try:
        db.session.delete(type_obj)
        db.session.commit()
        return jsonify({'message': 'Тип удален'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось удалить тип. Возможно, он используется.', 'details': str(e)}), 500

# --- Свойства типов ---
@app.route('/api/types/<int:type_id>/properties', methods=['GET'])
def get_type_properties(type_id):
    """Получить все свойства, связанные с конкретным типом"""
    type_obj = Type.query.get_or_404(type_id)
    properties = [{'id': p.id, 'name': p.name} for p in type_obj.properties]
    return jsonify(properties)

@app.route('/api/types/<int:type_id>/properties', methods=['PUT'])
@login_required
def update_type_properties(type_id):
    """Обновить список свойств для типа"""
    type_obj = Type.query.get_or_404(type_id)
    data = request.get_json()
    property_ids = data.get('property_ids', [])
    
    try:
        properties = Property.query.filter(Property.id.in_(property_ids)).all()
        if len(properties) != len(set(property_ids)):
            return jsonify({'error': 'Некоторые свойства не найдены'}), 400

        type_obj.properties.clear()
        for prop in properties:
            if prop not in type_obj.properties:
                type_obj.properties.append(prop)
                
        db.session.commit()
        return jsonify({'message': 'Свойства типа обновлены'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при обновлении свойств типа {type_id}: {e}")
        return jsonify({'error': 'Не удалось обновить свойства типа'}), 500

# --- Свойства ---
@app.route('/api/properties', methods=['GET'])
def get_properties():
    properties = Property.query.all()
    return jsonify([p.to_dict() for p in properties])

# --- Статусы ---
@app.route('/api/statuses', methods=['GET'])
def get_statuses():
    statuses = Status.query.all()
    return jsonify([s.to_dict() for s in statuses])

@app.route('/api/statuses', methods=['POST'])
@login_required
def create_status():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название статуса обязательно'}), 400
    try:
        new_status = Status(name=data['name'])
        db.session.add(new_status)
        db.session.commit()
        return jsonify(new_status.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось создать статус', 'details': str(e)}), 500

@app.route('/api/statuses/<int:id>', methods=['PUT'])
@login_required
def update_status(id):
    status = Status.query.get_or_404(id)
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название статуса обязательно'}), 400
    try:
        status.name = data['name']
        db.session.commit()
        return jsonify(status.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось обновить статус', 'details': str(e)}), 500

@app.route('/api/statuses/<int:id>', methods=['DELETE'])
@login_required
def delete_status(id):
    status = Status.query.get_or_404(id)
    try:
        db.session.delete(status)
        db.session.commit()
        return jsonify({'message': 'Статус удален'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось удалить статус. Возможно, он используется.', 'details': str(e)}), 500

# --- Отделы ---
@app.route('/api/departments', methods=['GET'])
def get_departments():
    departments = Department.query.all()
    return jsonify([d.to_dict() for d in departments])

@app.route('/api/departments', methods=['POST'])
@login_required
def create_department():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название отдела обязательно'}), 400
    try:
        new_department = Department(name=data['name'])
        db.session.add(new_department)
        db.session.commit()
        return jsonify(new_department.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось создать отдел', 'details': str(e)}), 500

@app.route('/api/departments/<int:id>', methods=['PUT'])
@login_required
def update_department(id):
    department = Department.query.get_or_404(id)
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Название отдела обязательно'}), 400
    try:
        department.name = data['name']
        db.session.commit()
        return jsonify(department.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось обновить отдел', 'details': str(e)}), 500

@app.route('/api/departments/<int:id>', methods=['DELETE'])
@login_required
def delete_department(id):
    department = Department.query.get_or_404(id)
    try:
        db.session.delete(department)
        db.session.commit()
        return jsonify({'message': 'Отдел удален'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось удалить отдел. Возможно, он используется.', 'details': str(e)}), 500

# --- Сотрудники ---
@app.route('/api/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([e.to_dict() for e in employees])

@app.route('/api/employees', methods=['POST'])
@login_required
def create_employee():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('department_id'):
        return jsonify({'error': 'Имя и отдел обязательны'}), 400
    try:
        new_employee = Employee(
            name=data['name'],
            department_id=data['department_id']
        )
        db.session.add(new_employee)
        db.session.commit()
        # Возвращаем объект с именем отдела для отображения
        employee_dict = new_employee.to_dict()
        dept = Department.query.get(new_employee.department_id)
        employee_dict['department_name'] = dept.name if dept else None
        return jsonify(employee_dict), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось создать сотрудника', 'details': str(e)}), 500

@app.route('/api/employees/<int:id>', methods=['PUT'])
@login_required
def update_employee(id):
    employee = Employee.query.get_or_404(id)
    data = request.get_json()
    if not data or not data.get('name') or not data.get('department_id'):
        return jsonify({'error': 'Имя и отдел обязательны'}), 400
    try:
        employee.name = data['name']
        employee.department_id = data['department_id']
        db.session.commit()
        # Возвращаем объект с именем отдела для отображения
        employee_dict = employee.to_dict()
        dept = Department.query.get(employee.department_id)
        employee_dict['department_name'] = dept.name if dept else None
        return jsonify(employee_dict)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось обновить сотрудника', 'details': str(e)}), 500

@app.route('/api/employees/<int:id>', methods=['DELETE'])
@login_required
def delete_employee(id):
    employee = Employee.query.get_or_404(id)
    try:
        db.session.delete(employee)
        db.session.commit()
        return jsonify({'message': 'Сотрудник удален'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Не удалось удалить сотрудника. Возможно, он используется.', 'details': str(e)}), 500

# === Эндпоинт для получения списка потребностей ===
@app.route('/api/needs', methods=['GET'])
@login_required
def get_needs():
    """Получить список всех потребностей."""
    try:
        needs = Need.query.all()
        return jsonify([need.to_dict() for need in needs]), 200
    except Exception as e:
        app.logger.error(f"Ошибка при получении списка потребностей: {e}")
        return jsonify({'error': 'Ошибка при загрузке данных'}), 500

# === Эндпоинт для создания новой потребности ===
@app.route('/api/needs', methods=['POST'])
@login_required
def create_need():
    """Создать новую потребность."""
    # Проверка прав доступа (если нужно, например, только для админов)
    # if current_user.role != 'admin':
    #     return jsonify({'error': 'Доступ запрещен'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Нет данных для создания потребности'}), 400

    # --- Проверка обязательных полей ---
    required_fields = ['department_id', 'asset_type_id', 'quantity', 'reason_date', 'status']
    missing_fields = [field for field in required_fields if field not in data or not data.get(field)]
    if missing_fields:
        return jsonify({'error': 'Отсутствуют обязательные поля', 'missing': missing_fields}), 400

    # --- Валидация и преобразование данных ---
    errors = {}
    try:
        department_id = int(data['department_id'])
        asset_type_id = int(data['asset_type_id'])
        quantity = int(data['quantity'])
        if quantity <= 0:
             errors['quantity'] = 'Количество должно быть положительным числом'
        # Проверка существования department и asset_type (опционально, но рекомендуется)
        # department = Department.query.get(department_id)
        # if not department:
        #     errors['department_id'] = 'Отдел не найден'
        # asset_type = Type.query.get(asset_type_id)
        # if not asset_type:
        #     errors['asset_type_id'] = 'Тип устройства не найден'
        
        # reason_date_str = data['reason_date']
        # reason_date = dt_date.fromisoformat(reason_date_str) # Ожидаем формат YYYY-MM-DD
    except ValueError as ve:
        # Это может произойти при int() или date.fromisoformat()
        return jsonify({'error': f'Неверный формат данных: {str(ve)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Ошибка обработки данных: {str(e)}'}), 400

    if errors:
        return jsonify({'error': 'Ошибка в данных', 'details': errors}), 400

    # --- Создание объекта ---
    try:
        # Безопасно обрабатываем строковые поля, учитывая возможность None
        status_raw = data.get('status')
        status = status_raw.strip() if status_raw is not None else ''
        
        note_raw = data.get('note')
        # Если note_raw None или пустая строка после strip, записываем None в БД
        note = note_raw.strip() if note_raw is not None and note_raw.strip() else None

        new_need = Need(
            department_id=department_id,
            asset_type_id=asset_type_id,
            quantity=quantity,
            reason_date=dt_date.fromisoformat(data['reason_date']),
            status=status, # Используем обработанную строку
            note=note      # Используем обработанную строку или None
        )
        db.session.add(new_need)
        db.session.commit()
        return jsonify(new_need.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при создании потребности: {e}")
        return jsonify({'error': 'Не удалось создать потребность', 'details': str(e)}), 500
    
# === Эндпоинт для пакетного удаления потребностей ===
@app.route('/api/needs/batch-delete', methods=['DELETE'])
@login_required
def delete_needs_batch():
    """
    Удаляет несколько потребностей по списку ID.
    Тело запроса: JSON {"ids": [1, 2, 3]}
    """
    try:
        data = request.get_json()
        if not data or 'ids' not in data:
            return jsonify({'error': 'Список ID не предоставлен'}), 400

        ids_to_delete = data['ids']
        if not isinstance(ids_to_delete, list):
            return jsonify({'error': 'IDs должны быть списком'}), 400

        # Проверка, что все IDs - целые числа
        try:
            ids_to_delete = [int(id_) for id_ in ids_to_delete]
        except (ValueError, TypeError):
            return jsonify({'error': 'Все ID должны быть целыми числами'}), 400

        if not ids_to_delete:
             return jsonify({'message': 'Нечего удалять'}), 200

        # Удаление записей
        deleted_count = Need.query.filter(Need.id.in_(ids_to_delete)).delete(synchronize_session=False)
        db.session.commit()

        return jsonify({'message': f'Удалено {deleted_count} потребностей'}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при пакетном удалении потребностей: {e}")
        return jsonify({'error': 'Ошибка при удалении потребностей'}), 500

# === Эндпоинт для получения одной потребности по ID ===
@app.route('/api/needs/<int:id>', methods=['GET'])
@login_required
def get_need_by_id(id):
    """Получить одну потребность по её ID."""
    try:
        need = db.session.get(Need, id) # Используем современный метод
        if not need:
            return jsonify({'error': 'Потребность не найдена'}), 404
        
        return jsonify(need.to_dict()), 200
    except Exception as e:
        app.logger.error(f"Ошибка при получении потребности {id}: {e}")
        return jsonify({'error': 'Ошибка при загрузке данных потребности'}), 500

# === Эндпоинт для обновления одной потребности по ID ===
@app.route('/api/needs/<int:id>', methods=['PUT'])
@login_required
def update_need(id):
    """Обновить потребность по её ID."""
    try:
        need = db.session.get(Need, id) # Используем современный метод
        if not need:
            return jsonify({'error': 'Потребность не найдена'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Нет данных для обновления'}), 400

        # --- Проверка и обновление полей ---
        # Поля, которые можно обновить
        updatable_fields = ['department_id', 'asset_type_id', 'quantity', 'reason_date', 'status', 'note']

        errors = {}
        for field in updatable_fields:
            if field in data:
                try:
                    if field in ['department_id', 'asset_type_id']:
                        value = int(data[field]) if data[field] not in (None, '') else None
                        # Можно добавить проверку существования department/type
                        # if value and not (Department.query.get(value) if field == 'department_id' else Type.query.get(value)):
                        #     errors[field] = f'Неверный ID {field}'
                        setattr(need, field, value)
                    
                    elif field == 'quantity':
                        value = int(data[field])
                        if value <= 0:
                            errors['quantity'] = 'Количество должно быть положительным'
                        else:
                            setattr(need, field, value)
                    
                    elif field == 'reason_date':
                         if data[field]:
                             # Ожидаем формат YYYY-MM-DD
                             setattr(need, field, dt_date.fromisoformat(data[field]))
                         else:
                             setattr(need, field, None)

                    elif field in ['status', 'note']:
                        # Для строковых полей просто присваиваем, обрезая пробелы
                        value = data[field].strip() if data[field] is not None else ''
                        if field == 'status' and not value:
                             errors['status'] = 'Статус не может быть пустым'
                        else:
                             setattr(need, field, value if value else None) # note может быть None

                except ValueError as ve:
                    errors[field] = f'Неверный формат для {field}: {str(ve)}'
                except Exception as e:
                    errors[field] = f'Ошибка обработки {field}: {str(e)}'

        if errors:
            return jsonify({'error': 'Ошибка в данных', 'details': errors}), 400

        # Обновляем дату изменения (если у вас есть такое поле в модели)
        # need.updated_at = datetime.utcnow() # Пример

        db.session.commit()
        return jsonify(need.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при обновлении потребности {id}: {e}")
        return jsonify({'error': 'Ошибка при обновлении потребности'}), 500

# === Эндпоинт для пакетного обновления потребностей (например, изменения статуса) ===
@app.route('/api/needs/batch-update', methods=['PATCH']) # <<< Используем PATCH
@login_required
def update_needs_batch():
    """
    Обновляет поля указанных потребностей.
    Тело запроса: JSON {"ids": [1, 2, 3], "status": "Новый статус"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Нет данных для обновления'}), 400

        ids_to_update = data.get('ids')
        status = data.get('status')

        # --- Валидация входных данных ---
        if not ids_to_update or not isinstance(ids_to_update, list):
            return jsonify({'error': 'Список ID не предоставлен или неверного формата'}), 400

        if not status or not isinstance(status, str) or not status.strip():
             return jsonify({'error': 'Новый статус не предоставлен или пуст'}), 400

        status_clean = status.strip()

        # Проверка, что все IDs - целые числа
        try:
            ids_to_update = [int(id_) for id_ in ids_to_update]
        except (ValueError, TypeError):
            return jsonify({'error': 'Все ID должны быть целыми числами'}), 400

        if not ids_to_update:
             return jsonify({'message': 'Нечего обновлять'}), 200

        # --- Обновление записей ---
        # Используем bulk_update_mappings для эффективности
        updates = [{'id': id_, 'status': status_clean} for id_ in ids_to_update]
        # bulk_update_mappings обновляет только указанные поля
        db.session.bulk_update_mappings(Need, updates)
        db.session.commit()

        return jsonify({'message': f'Статус успешно обновлён для {len(ids_to_update)} потребностей'}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Ошибка при пакетном обновлении потребностей: {e}")
        return jsonify({'error': 'Ошибка при обновлении потребностей'}), 500

# === Эндпоинт для УДАЛЕНИЯ одной потребности по ID ===
@app.route('/api/needs/<int:id>', methods=['DELETE']) # <<< ВАЖНО: methods=['DELETE']
@login_required # <<< ВАЖНО: если требуется аутентификация
def delete_need(id):
    """Удалить потребность по её ID."""
    try:
        # Используем современный метод get для поиска объекта
        need = db.session.get(Need, id)
        if not need:
            # Если не найден, возвращаем 404
            return jsonify({'error': 'Потребность не найдена'}), 404

        # Выполняем удаление
        db.session.delete(need)
        db.session.commit()
        
        # Возвращаем сообщение об успехе
        return jsonify({'message': f'Потребность с ID {id} успешно удалена'}), 200

    except Exception as e:
        # Откатываем транзакцию в случае ошибки
        db.session.rollback()
        # Логируем ошибку для отладки
        app.logger.error(f"Ошибка при удалении потребности с ID {id}: {e}")
        # Возвращаем общую ошибку сервера
        return jsonify({'error': 'Ошибка при удалении потребности'}), 500

# --- QR-код ---
@app.route('/api/qrcodes', methods=['POST'])
@login_required # Убедитесь, что доступ ограничен
def generate_multiple_qr_codes_base64():
    """
    Генерирует QR-коды для списка активов и возвращает их в формате base64.
    Ожидает JSON: {"ids": [1, 2, 3]}
    Возвращает JSON: [{"id": 1, "inventory_number": "...", "full_name": "...", "qr_base64": "..."}, ...]
    """
    try:
        data = request.get_json()
        asset_ids = data.get('ids', [])
        
        if not isinstance(asset_ids, list):
             return jsonify({'error': 'Неверный формат данных. Ожидается список ID.'}), 400

        if not asset_ids:
            return jsonify({'error': 'Список ID активов пуст.'}), 400

        # Получаем базовый URL фронтенда для формирования ссылок в QR-кодах
        # Убедитесь, что FRONTEND_BASE_URL задан в config.py или .env
        frontend_base_url = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:3000') 

        results = []
        for asset_id in asset_ids:
            # 1. Получаем актив из БД
            asset = Asset.query.get(asset_id)
            if not asset:
                # Пропускаем несуществующие активы или логируем ошибку
                app.logger.warning(f"Актив с ID {asset_id} не найден при генерации QR-кодов.")
                continue

            # 2. Формируем URL для перехода по QR-коду
            asset_url = f"{frontend_base_url}/assets/{asset_id}"

            # 3. Генерируем QR-код
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(asset_url)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # 4. Преобразуем изображение в байтовый поток
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0) # Перемещаем указатель в начало

            # 5. Кодируем изображение в base64
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')

            # 6. Формируем полное имя актива (как в Asset.to_dict)
            # Предполагается, что у актива есть связь type_obj -> type
            type_name = asset.type_obj.name if asset.type_obj else "Без типа"
            full_asset_name = f"{type_name} {asset.brand} {asset.model}".strip()

            # 7. Добавляем результат
            results.append({
                'id': asset.id,
                'inventory_number': asset.inventory_number,
                'full_name': full_asset_name, # Используем составное имя
                'qr_base64': img_base64
            })

        return jsonify(results), 200

    except Exception as e:
        app.logger.error(f"Ошибка при массовой генерации QR-кодов: {e}")
        return jsonify({'error': 'Не удалось сгенерировать QR-коды', 'details': str(e)}), 500

@app.route('/api/assets/<int:asset_id>/qr')
def get_asset_qr_code(asset_id):
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Актив не найден'}), 404

        frontend_base_url = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:3000')
        asset_url = f"{frontend_base_url}/assets/{asset_id}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(asset_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)

        return send_file(
            img_buffer, 
            mimetype='image/png', 
            as_attachment=False, 
            download_name=f'qr_{asset_id}.png'
        )

    except Exception as e:
        app.logger.error(f"Ошибка при генерации QR-кода для актива {asset_id}: {e}")
        return jsonify({'error': 'Не удалось сгенерировать QR-код', 'details': str(e)}), 500

# --- История перемещений ---
@app.route('/api/moves', methods=['GET'])
def get_moves():
    try:
        moves = Change.query.filter(
            (Change.field == 'room') | (Change.field == 'department_id')
        ).order_by(Change.changed_at.desc()).all()

        result = []
        for move in moves:
            if move.field == 'room':
                result.append({
                    'id': move.id,
                    'asset_id': move.asset_id,
                    'date': move.changed_at.isoformat(),
                    'inventory_number': move.inventory_number,
                    'asset_name': move.asset_name,
                    'from_room': move.old_value or '-',
                    'to_room': move.new_value or '-',
                    'move_type': 'room'
                })
            elif move.field == 'department_id':
                from_dept_name = "-"
                to_dept_name = "-"

                if move.old_value:
                    try:
                        old_dept_id = int(move.old_value)
                        old_dept = Department.query.get(old_dept_id)
                        from_dept_name = old_dept.name if old_dept else f"Отдел #{old_dept_id}"
                    except ValueError:
                        from_dept_name = str(move.old_value)

                if move.new_value:
                     try:
                        new_dept_id = int(move.new_value)
                        new_dept = Department.query.get(new_dept_id)
                        to_dept_name = new_dept.name if new_dept else f"Отдел #{new_dept_id}"
                     except ValueError:
                         to_dept_name = str(move.new_value)

                result.append({
                    'id': move.id,
                    'asset_id': move.asset_id,
                    'date': move.changed_at.isoformat(),
                    'inventory_number': move.inventory_number,
                    'asset_name': move.asset_name,
                    'from_room': from_dept_name,
                    'to_room': to_dept_name,
                    'move_type': 'department'
                })

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Ошибка при получении истории перемещений: {e}")
        return jsonify({'error': 'Ошибка при загрузке данных'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
