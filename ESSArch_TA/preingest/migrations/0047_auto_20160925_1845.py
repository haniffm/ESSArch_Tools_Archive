# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-25 18:45
from __future__ import unicode_literals

from django.db import migrations
import picklefield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('preingest', '0046_auto_20160916_1233'),
    ]

    operations = [
        migrations.AlterField(
            model_name='processtask',
            name='params',
            field=picklefield.fields.PickledObjectField(default={}, editable=False, null=True),
        ),
        migrations.AlterField(
            model_name='processtask',
            name='result_params',
            field=picklefield.fields.PickledObjectField(default={}, editable=False, null=True),
        ),
    ]
