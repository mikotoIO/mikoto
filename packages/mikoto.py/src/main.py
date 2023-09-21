from schema import *

from typing import List
from pydantic import TypeAdapter


if __name__ == '__main__':
    # u = schema.User.model_validate_json('{"id": "1", "name": "Misaka Mikoto"}')
    us = TypeAdapter(List[User]).validate_python([{
        'id': '1',
        'name': 'Misaka Mikoto',
        'avatar': None,
        'category': None,
    }])
    print(us[0].name)