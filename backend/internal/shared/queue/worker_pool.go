package queue

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type JobTask struct {
	ID        string
	Name      string
	Handler   func(ctx context.Context) error
	Retries   int
	MaxRetry  int
	CreatedAt time.Time
}

type WorkerPool interface {
	Enqueue(task JobTask)
	Start(ctx context.Context)
	Stop()
}

type workerPool struct {
	concurrency int
	taskQueue   chan JobTask
	wg          sync.WaitGroup
	stopOnce    sync.Once
}

func NewWorkerPool(concurrency int, bufferSize int) WorkerPool {
	if concurrency <= 0 {
		concurrency = 10
	}
	if bufferSize <= 0 {
		bufferSize = 1000
	}

	return &workerPool{
		concurrency: concurrency,
		taskQueue:   make(chan JobTask, bufferSize),
	}
}

func (p *workerPool) Enqueue(task JobTask) {
	if task.MaxRetry == 0 {
		task.MaxRetry = 3
	}
	if task.CreatedAt.IsZero() {
		task.CreatedAt = time.Now()
	}

	select {
	case p.taskQueue <- task:
	default:
		fmt.Printf("[WorkerPool] Warning: Queue buffer full, dropping or degrading task %s (%s)\n", task.ID, task.Name)
	}
}

func (p *workerPool) Start(ctx context.Context) {
	for i := 0; i < p.concurrency; i++ {
		p.wg.Add(1)
		go p.worker(ctx, i)
	}
}

func (p *workerPool) worker(ctx context.Context, workerID int) {
	defer p.wg.Done()

	for {
		select {
		case <-ctx.Done():
			return
		case task, ok := <-p.taskQueue:
			if !ok {
				return
			}
			p.processTask(ctx, task)
		}
	}
}

func (p *workerPool) processTask(ctx context.Context, task JobTask) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("[WorkerPool] Recovered panic processing task %s (%s): %v\n", task.ID, task.Name, r)
		}
	}()

	err := task.Handler(ctx)
	if err != nil && task.Retries < task.MaxRetry {
		task.Retries++
		time.Sleep(time.Duration(task.Retries*500) * time.Millisecond) // Exponential backoff
		p.Enqueue(task)
	}
}

func (p *workerPool) Stop() {
	p.stopOnce.Do(func() {
		close(p.taskQueue)
		p.wg.Wait()
	})
}
