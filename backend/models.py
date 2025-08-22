# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), default='user')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role
        }

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        }

class Status(db.Model):
    __tablename__ = 'statuses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        }

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department_id': self.department_id,
        }

class Property(db.Model):
    __tablename__ = 'properties'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)

    types = db.relationship('Type', secondary='type_properties', back_populates='properties')

    def to_dict(self): # Добавлен метод to_dict
        return {
            'id': self.id,
            'name': self.name,
        }

type_properties = db.Table('type_properties',
    db.Column('type_id', db.Integer, db.ForeignKey('types.id'), primary_key=True),
    db.Column('property_id', db.Integer, db.ForeignKey('properties.id'), primary_key=True)
)

class Type(db.Model):
    __tablename__ = 'types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    properties_id = db.Column(db.Integer, db.ForeignKey('properties.id'))

    properties = db.relationship('Property', secondary='type_properties', back_populates='types')
    assets = db.relationship('Asset', backref='type_obj') # Избегаем конфликта с полем type

    def to_dict(self): # Добавлен метод to_dict
        return {
            'id': self.id,
            'name': self.name,
        }

class Asset(db.Model):
    __tablename__ = 'assets'
    
    id = db.Column(db.Integer, primary_key=True)
    serial_number = db.Column(db.String(100))
    inventory_number = db.Column(db.String(100), unique=True, nullable=False)
    brand = db.Column(db.String(255), nullable=False)
    model = db.Column(db.String(255), nullable=False)
    type_id = db.Column(db.Integer, db.ForeignKey('types.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    room = db.Column(db.String(255))
    purchase_date = db.Column(db.Date)
    responsible_person = db.Column(db.Integer, db.ForeignKey('employees.id'))
    actual_user = db.Column(db.String(255))
    comments = db.Column(db.Text)
    status_id = db.Column(db.Integer, db.ForeignKey('statuses.id'))
    
    diagonal = db.Column(db.String(50))
    CPU = db.Column(db.String(100))
    RAM = db.Column(db.String(50))
    Drive = db.Column(db.String(100))
    OS = db.Column(db.String(100))
    IP_address = db.Column(db.String(45), nullable=True)
    number = db.Column(db.String(50))

    department = db.relationship('Department', backref='assets')
    status = db.relationship('Status', backref='assets')
    employee = db.relationship('Employee', backref='assets')

    def to_dict(self):
        return {
            'id': self.id,
            'serial_number': self.serial_number,
            'inventory_number': self.inventory_number,
            'brand': self.brand,
            'model': self.model,
            'type_id': self.type_id,
            'department_id': self.department_id,
            'room': self.room,
            'purchase_date': str(self.purchase_date) if self.purchase_date else None,
            'responsible_person': self.responsible_person,
            'actual_user': self.actual_user,
            'comments': self.comments,
            'status_id': self.status_id,
            'diagonal': self.diagonal,
            'CPU': self.CPU,
            'RAM': self.RAM,
            'Drive': self.Drive,
            'OS': self.OS,
            'IP_address': self.IP_address,
            'number': self.number,
            'category_name': self.type_obj.name if self.type_obj else None,
            'full_name': f"{self.type_obj.name if self.type_obj else 'Без типа'} {self.brand} {self.model}"
        }

class Change(db.Model):
    __tablename__ = 'changes'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=True)
    inventory_number = db.Column(db.String(50))
    asset_name = db.Column(db.String(200))
    action = db.Column(db.String(50))
    field = db.Column(db.String(100))
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    asset = db.relationship('Asset', backref='changes')

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'inventory_number': self.inventory_number,
            'asset_name': self.asset_name,
            'action': self.action,
            'field': self.field,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'changed_at': self.changed_at.strftime("%d.%m.%Y %H:%M:%S") if self.changed_at else None
        }

    def __repr__(self):
        return f"<Change {self.action} ({self.field}) at {self.changed_at}>"
