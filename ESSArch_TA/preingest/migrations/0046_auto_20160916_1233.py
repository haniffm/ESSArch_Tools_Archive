# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-16 12:33
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('preingest', '0045_auto_20160916_1134'),
    ]

    operations = [
        migrations.AlterField(
            model_name='processtask',
            name='name',
            field=models.CharField(max_length=255),
        ),
    ]
