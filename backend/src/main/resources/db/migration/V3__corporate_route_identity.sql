CREATE UNIQUE INDEX page_route_key_unique ON content_items((metadata->>'routeKey')) WHERE kind='PAGE' AND metadata ? 'routeKey';
