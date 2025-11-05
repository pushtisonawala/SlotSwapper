from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Reset database by dropping all tables'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Get all table names
            cursor.execute("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            tables = cursor.fetchall()
            
            # Drop all tables
            for table in tables:
                table_name = table[0]
                cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE;')
                self.stdout.write(f'Dropped table: {table_name}')
            
            self.stdout.write(
                self.style.SUCCESS('Successfully reset database')
            )