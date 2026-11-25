---
name: add-catapult-cat
description: Добавление нового кота-снаряда в Catapult Chaos через CatDefinition и CatRegistry. Использовать для новых способностей, изменения физики котов и процедурной внешности котов.
---

# Добавление кота

Работай только в `crazy-cats`. Сначала прочитай `AGENTS.md`, `ARCHITECTURE.md`, `src/entities/types.ts` и два похожих файла в `src/entities/cats/`.

## Процесс

1. Кратко назови способность и файлы, которые изменишь.
2. Создай один `src/entities/cats/<Name>Cat.ts` с `CatDefinition`.
3. Реализуй мгновенную способность в `onAbilityActivate`; продолжительную — через `setAbilityDuration`, `onAbilityUpdate`, `onAbilityEnd`.
4. Скорость меняй только через `ctx.physics.setVelocityCapped`. Отложенные действия — через `ctx.schedule`.
5. Укажи `allowAbilityAfterCollision` осознанно. Не изменяй это правило глобально.
6. Добавь регистрацию в `src/entities/cats/index.ts` и кота в очередь демо-уровня.
7. Для уникального аксессуара сделай минимальную ветку в `CatRenderer.drawVariant`; эмоции уже реализованы.

## Проверка

- Кот появляется в рогатке, запускается и имеет подсказку в HUD.
- Способность одноразовая и корректно работает до/после первого удара согласно конфигу.
- Новые тела получают метаданные через `createCatBody`/`attachMetadata`.
- Нет DOM, `setTimeout`, неограниченных скоростей и обращений к SDK в файле кота.
- Выполни `npm run typecheck` и `npm run build`, затем ручную проверку в браузере.
