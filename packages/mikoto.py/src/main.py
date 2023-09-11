import schema

if __name__ == '__main__':
    # u = schema.User.model_validate_json('{"id": "1", "name": "Misaka Mikoto"}')
    u = schema.User.model_validate({
        'id': '1',
        'name': 'Misaka Mikoto',
    })
    print(u.name)