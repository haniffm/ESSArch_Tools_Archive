# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-13 15:57
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ip', '0013_auto_20160913_1116'),
    ]

    operations = [
        migrations.AlterField(
            model_name='informationpackage',
            name='CreateDate',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
