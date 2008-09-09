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

from mapfish.lib.filters import Filter

class FeatureId(Filter):
    def __init__(self, id_column, value):
        """Create a feature id filter.

          id_column 
              the Column object corresponding to the id column.

          value
              this filter's value
        """
        self.id_column = id_column
        self.value = value

    def to_sql_expr(self):
        """Return the SQLAlchemy SQL expression corresponding to that filter.
        """
        expr = self.id_column == self.value
        return expr
