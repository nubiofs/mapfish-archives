# 
# Copyright (C) 2007-2008  Camptocamp
#  
# This file is part of MapFish
#  
# MapFish is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#  
# MapFish is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#  
# You should have received a copy of the GNU Lesser General Public License
# along with MapFish.  If not, see <http://www.gnu.org/licenses/>.
#

from pylons import config

from sqlalchemy import Column, MetaData, Table, types
from sqlalchemy.orm import mapper

from mapfish.sqlalchemygeom import Geometry
from mapfish.sqlalchemygeom import GeometryTableMixIn

lines_table = Table(
    'lines',
    MetaData(config['pylons.g'].sa_mapfishsample_engine),
    Column('the_geom', Geometry(4326)),
    autoload=True)

class Line(GeometryTableMixIn):
    # for GeometryTableMixIn to do its job the __table__ property
    # must be set here
    __table__ = lines_table

mapper(Line, lines_table)
